import fs from 'node:fs/promises';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { setTimeout as wait } from 'node:timers/promises';
import { AppConfig } from '../config';
import { logger } from '../util/logger';
import type { BatchExecutionResult, CodexClient, PullRequestResult, TaskBatchItem } from './types';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class CodexUIClient implements CodexClient {
  static async launch(config: AppConfig): Promise<CodexUIClient> {
    const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext();

    if (config.codexUiCookiesPath) {
      try {
        const cookiesJson = await fs.readFile(config.codexUiCookiesPath, 'utf8');
        const cookies = JSON.parse(cookiesJson);
        await context.addCookies(cookies);
        logger.info('Loaded cookies from %s', config.codexUiCookiesPath);
      } catch (error) {
        logger.warn('Unable to load cookies from %s: %o', config.codexUiCookiesPath, error);
      }
    }

    const page = await context.newPage();
    await page.goto(config.codexUiUrl, { waitUntil: 'networkidle' });

    const client = new CodexUIClient(config, browser, context, page);
    await client.ensureLoggedIn();
    await client.ensureRepoSelected();
    return client;
  }

  private lastKnownBranch?: string;

  private constructor(
    private readonly config: AppConfig,
    private readonly browser: Browser,
    private readonly context: BrowserContext,
    private readonly page: Page,
  ) {}

  private async ensureLoggedIn(): Promise<void> {
    if (this.config.codexUiCookiesPath) {
      logger.info('Assuming authenticated via cookies');
      return;
    }

    if (!this.config.codexUiEmail || !this.config.codexUiPassword) {
      throw new Error('CODEX_UI_EMAIL and CODEX_UI_PASSWORD must be set when cookies are not provided');
    }

    logger.info('Attempting interactive login with email/password');
    const emailInput = this.page.locator('input[type="email"]');
    await emailInput.waitFor({ timeout: 15000 });
    await emailInput.fill(this.config.codexUiEmail);
    await this.page.locator('input[type="password"]').fill(this.config.codexUiPassword);
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.page.locator('button[type="submit"]').click(),
    ]);
    logger.info('Login flow submitted');
  }

  private async ensureRepoSelected(): Promise<void> {
    const repoSelector = this.config.selectors.repoToggle;
    await this.page.waitForTimeout(1000);
    const toggle = this.page.locator(repoSelector);
    await toggle.click();
    const searchBox = this.page.locator('input[type="search"], input[placeholder*="Search"]');
    await searchBox.fill(`${this.config.githubOwner}/${this.config.githubRepo}`);
    await wait(500);
    const repoButton = this.page.locator(`text="${this.config.githubOwner}/${this.config.githubRepo}"`).first();
    await repoButton.click();
    logger.info('Selected repository %s/%s', this.config.githubOwner, this.config.githubRepo);
  }

  private async openCodeComposer(): Promise<void> {
    const button = this.page.locator(this.config.selectors.codeButton).first();
    await button.waitFor({ timeout: 15000 });
    await button.click();
  }

  private formatBatch(batch: TaskBatchItem[]): string {
    const sorted = [...batch].sort((a, b) => a.order - b.order);
    return sorted
      .map((item, index) => `${index + 1}) ${item.task.title}`)
      .join('\n');
  }

  async runBatch(batch: TaskBatchItem[]): Promise<BatchExecutionResult> {
    if (!batch.length) {
      return { successes: [], failures: [] };
    }

    await this.openCodeComposer();
    const composer = this.page.locator('textarea, [contenteditable="true"]').last();
    await composer.waitFor({ timeout: 15000 });
    const instructions = this.formatBatch(batch);
    logger.info('Submitting batch to Codex:\n%s', instructions);
    await composer.fill(instructions);
    await composer.press('Enter');

    const { successes, failures } = await this.waitForBatchResolution(batch);
    logger.info('Batch completed: %d success, %d failure', successes.length, failures.length);
    return { successes, failures };
  }

  private async waitForBatchResolution(batch: TaskBatchItem[]): Promise<{ successes: TaskBatchItem['task'][]; failures: TaskBatchItem['task'][]; }> {
    const deadline = Date.now() + this.config.globalTimeoutSeconds * 1000;
    const successes = new Set<string>();
    const failures = new Set<string>();
    let pollsWithoutVerdict = 0;

    const applyVerdictFromTranscript = (transcript: string) => {
      for (const item of batch) {
        const plusRegex = new RegExp(`\\+\\s*${escapeRegex(item.task.title)}`, 'i');
        const minusRegex = new RegExp(`[-✗xX]\\s*${escapeRegex(item.task.title)}`, 'i');
        if (plusRegex.test(transcript)) {
          successes.add(item.task.hash);
          failures.delete(item.task.hash);
        } else if (minusRegex.test(transcript)) {
          if (!successes.has(item.task.hash)) {
            failures.add(item.task.hash);
          }
        }
      }
    };

    while (Date.now() < deadline) {
      const transcript = await this.page.locator('body').innerText();
      applyVerdictFromTranscript(transcript);

      if (successes.size + failures.size >= batch.length) {
        break;
      }

      pollsWithoutVerdict += 1;
      if (
        this.config.statusFallbackEnabled &&
        this.config.statusFallbackEveryPolls > 0 &&
        pollsWithoutVerdict % this.config.statusFallbackEveryPolls === 0
      ) {
        logger.info('No conclusive Codex signal after %d poll(s); sending status fallback prompt', pollsWithoutVerdict);
        await this.sendStatusFallbackPrompt();
        await wait(2000);
        const statusTranscript = await this.page.locator('body').innerText();
        applyVerdictFromTranscript(statusTranscript);
        if (successes.size + failures.size >= batch.length) {
          break;
        }
      }

      await wait(this.config.uiPollSeconds * 1000);
    }

    const successTasks = batch
      .filter((item) => successes.has(item.task.hash))
      .map((item) => item.task);
    const failureTasks = batch
      .filter((item) => !successes.has(item.task.hash))
      .map((item) => item.task);

    if (failureTasks.length && Date.now() >= deadline) {
      logger.warn('Timeout waiting for Codex outcome; treating unresolved tasks as failures');
    }

    return { successes: successTasks, failures: failureTasks };
  }

  async createPr(summary: string, description: string): Promise<PullRequestResult> {
    await this.openCodeComposer();
    const composer = this.page.locator('textarea, [contenteditable="true"]').last();
    await composer.waitFor({ timeout: 15000 });
    await composer.fill('create pr');
    await composer.press('Enter');

    await wait(2000);
    const titleInput = this.page.locator('input[name="title"], textarea[name="title"], input[placeholder*="Title"]');
    if (await titleInput.count()) {
      await titleInput.first().fill(summary);
    }
    const descriptionInput = this.page.locator('textarea[name="description"], textarea[placeholder*="Description"], textarea[placeholder*="summary"]');
    if (await descriptionInput.count()) {
      await descriptionInput.first().fill(description);
    }

    const submitButton = this.page.locator('button:has-text("Create PR"), button:has-text("Submit"), button.btn-primary');
    await submitButton.first().click({ trial: false }).catch((error) => {
      logger.warn('Failed to click PR submit button immediately: %o', error);
    });

    await wait(5000);
    const branchText = await this.extractBranchName();
    const prLink = await this.extractLatestLink();
    if (branchText) {
      this.lastKnownBranch = branchText;
    }
    logger.info('PR creation attempted. branch=%s link=%s', branchText, prLink ?? 'n/a');
    return { branch: branchText, url: prLink };
  }

  async ask(prompt: string): Promise<string> {
    await this.openCodeComposer();
    const composer = this.page.locator('textarea, [contenteditable="true"]').last();
    await composer.waitFor({ timeout: 15000 });
    await composer.fill(prompt);
    await composer.press('Enter');

    const deadline = Date.now() + this.config.globalTimeoutSeconds * 1000;
    let previousLength = 0;
    while (Date.now() < deadline) {
      const transcript = await this.page.locator('body').innerText();
      if (transcript.length !== previousLength) {
        previousLength = transcript.length;
        if (/^- \[ \]/m.test(transcript)) {
          const response = transcript.slice(transcript.lastIndexOf('- [ ]')).trim();
          return response;
        }
      }
      await wait(this.config.uiPollSeconds * 1000);
    }
    throw new Error('Timed out waiting for ask response');
  }

  async selectBranch(branch: string): Promise<void> {
    const branchMenu = this.page.locator(this.config.selectors.branchMenu);
    await branchMenu.waitFor({ timeout: 15000 });
    await branchMenu.click();

    const branchOption = this.page.locator(`role=option[name="${branch}"]`).first();
    if (await branchOption.count()) {
      await branchOption.click();
    } else {
      const textMatch = this.page.locator(`text="${branch}"`).first();
      await textMatch.waitFor({ timeout: 5000 });
      await textMatch.click();
    }

    await wait(500);
    this.lastKnownBranch = branch;
    logger.info('Selected branch %s via UI', branch);
  }

  async getActiveBranch(): Promise<string | undefined> {
    if (this.lastKnownBranch) {
      return this.lastKnownBranch;
    }
    return this.extractBranchName();
  }

  async close(): Promise<void> {
    await this.context.close();
    await this.browser.close();
  }

  private async extractBranchName(): Promise<string | undefined> {
    const branchMenu = this.page.locator(this.config.selectors.branchMenu);
    try {
      await branchMenu.waitFor({ timeout: 3000 });
    } catch {
      return undefined;
    }
    const text = await branchMenu.innerText();
    return text?.trim() || undefined;
  }

  private async extractLatestLink(): Promise<string | undefined> {
    const link = this.page.locator('a[href*="github.com"]');
    if (await link.count()) {
      return (await link.last().getAttribute('href')) ?? undefined;
    }
    return undefined;
  }

  private async sendStatusFallbackPrompt(): Promise<void> {
    const composer = this.page.locator('textarea, [contenteditable="true"]').last();
    await composer.waitFor({ timeout: 15000 });
    await composer.fill(this.config.statusFallbackPrompt);
    await composer.press('Enter');
  }
}
