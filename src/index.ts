import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { loadConfig } from './config';
import { createCodexClient } from './codex/client-factory';
import type { BatchExecutionResult, TaskBatchItem } from './codex/types';
import { appendNewTaskList, findNextTasks, parseTasksFile, setTaskCompletion, type RepoTaskList, type TaskFile } from './io/tasks-file';
import { OrchestratorState, StateStore } from './io/state';
import { runQaChecks } from './qa/gates';
import { logger } from './util/logger';

const MIN_TASKS = 6;
const MAX_TASKS = 10;
const ASK_MAX_ATTEMPTS = 3;
const UI_MAX_ATTEMPTS = 3;

interface ChecklistParseResult {
  items: string[];
  overflow: string[];
}

interface IterationOutcome {
  shouldContinue: boolean;
  sleepSeconds?: number;
}

interface LoopContext {
  config: Awaited<ReturnType<typeof loadConfig>>;
  client: Awaited<ReturnType<typeof createCodexClient>>;
  state: OrchestratorState;
  deadline: number;
}

function cleanupPausedRepos(state: OrchestratorState): void {
  if (!state.pausedRepos) {
    state.pausedRepos = {};
    return;
  }
  const now = Date.now();
  for (const [repo, iso] of Object.entries(state.pausedRepos)) {
    const until = Date.parse(iso);
    if (Number.isNaN(until) || until <= now) {
      delete state.pausedRepos[repo];
      logger.info('Cooldown expired for repo %s; resuming eligibility', repo);
    }
  }
}

function buildPausedRepoSet(state: OrchestratorState): Set<string> {
  return new Set(Object.keys(state.pausedRepos ?? {}));
}

async function readPrompt(filePath: string, repo: string, context: string): Promise<string> {
  const template = await fs.readFile(filePath, 'utf8');
  return template.replace(/{{repo}}/g, repo).replace(/{{context}}/g, context);
}

function parseChecklistResponse(response: string): ChecklistParseResult {
  const lines = response
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- [ ]'))
    .map((line) => line.replace(/^- \[ \] ?/, '').trim())
    .filter((line) => line.length > 0);

  const seen = new Set<string>();
  const items: string[] = [];
  const overflow: string[] = [];

  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (items.length < MAX_TASKS) {
      items.push(line);
    } else {
      overflow.push(line);
    }
  }

  return { items, overflow };
}

async function executeWithRetry<T>(label: string, action: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let delay = 1000;
  while (attempt < UI_MAX_ATTEMPTS) {
    attempt += 1;
    try {
      return await action();
    } catch (error) {
      if (attempt >= UI_MAX_ATTEMPTS) {
        logger.error('%s failed after %d attempts: %o', label, attempt, error);
        throw error;
      }
      logger.warn('%s failed (attempt %d/%d); retrying in %dms', label, attempt, UI_MAX_ATTEMPTS, delay);
      await wait(delay);
      delay *= 2;
    }
  }
  throw new Error(`${label} retries exhausted`);
}

function buildRepoContext(repoSection?: RepoTaskList): string {
  if (!repoSection) {
    return 'No existing tasks available.';
  }
  if (!repoSection.tasks.length) {
    return 'No historical tasks yet.';
  }
  return repoSection.tasks.map((task) => `${task.completed ? '✓' : '•'} ${task.title}`).join('\n');
}

function determineRepoForAsk(
  parsed: TaskFile,
  preferred: string | undefined,
  fallback: string | undefined,
  skipRepos: Set<string>,
): string | undefined {
  if (preferred && !skipRepos.has(preferred)) {
    return preferred;
  }
  for (let index = parsed.repoTasks.length - 1; index >= 0; index -= 1) {
    const repo = parsed.repoTasks[index]?.repo;
    if (repo && !skipRepos.has(repo)) {
      return repo;
    }
  }
  if (fallback && !skipRepos.has(fallback)) {
    return fallback;
  }
  return undefined;
}

async function resolvePromptForRepo(context: LoopContext, repo: string): Promise<string> {
  const customPrompt = path.join(context.config.promptsDir, `prompt_create_prompt_${repo}.md`);
  try {
    await fs.access(customPrompt);
    return customPrompt;
  } catch (error) {
    logger.warn('Custom prompt %s missing for repo %s (%o); falling back to new_list_prompt.txt', customPrompt, repo, error);
  }
  return path.join(context.config.promptsDir, 'new_list_prompt.txt');
}

async function requestTasksForRepo(
  context: LoopContext,
  repo: string,
  repoContext: string,
): Promise<{ tasks: string[]; overflow: string[] }> {
  const promptPath = await resolvePromptForRepo(context, repo);
  const prompt = await readPrompt(promptPath, repo, repoContext);

  const seen = new Set<string>();
  const aggregated: string[] = [];
  const overflow: string[] = [];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await executeWithRetry(`ask(${repo})`, () => context.client.ask(prompt));
    const parsed = parseChecklistResponse(response);
    for (const item of parsed.items) {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      aggregated.push(item);
    }
    for (const item of parsed.overflow) {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      overflow.push(item);
    }
    if (aggregated.length >= MIN_TASKS) {
      break;
    }
    if (attempt === 0) {
      logger.warn('ASK for %s returned %d unique items (<%d); retrying once', repo, aggregated.length, MIN_TASKS);
    }
  }

  if (aggregated.length < MIN_TASKS) {
    logger.warn('ASK for %s yielded %d items; below minimum threshold', repo, aggregated.length);
    return { tasks: [], overflow };
  }

  const trimmed = aggregated.slice(0, MAX_TASKS);
  const combinedOverflow = [...overflow, ...aggregated.slice(MAX_TASKS)];
  if (combinedOverflow.length) {
    logger.info('ASK overflow for %s trimmed: %o', repo, combinedOverflow);
  }

  return { tasks: trimmed, overflow: combinedOverflow };
}

async function ensureTaskInventory(
  context: LoopContext,
  parsed: TaskFile,
  skipRepos: Set<string>,
): Promise<{ parsed: TaskFile; stop: boolean; skippedRepo?: string }> {
  const pending = findNextTasks(parsed, context.state.lastRepo, skipRepos);
  if (pending.length) {
    return { parsed, stop: false };
  }

  const repo = determineRepoForAsk(parsed, context.state.lastRepo, context.config.githubRepo, skipRepos);
  if (!repo) {
    logger.info('No repositories available for ASK replenishment');
    return { parsed, stop: false };
  }

  const repoSection = parsed.repoTasks.find((entry) => entry.repo === repo);
  const repoContext = buildRepoContext(repoSection);

  for (let attempt = 1; attempt <= ASK_MAX_ATTEMPTS; attempt += 1) {
    const { tasks } = await requestTasksForRepo(context, repo, repoContext);
    if (tasks.length) {
      await appendNewTaskList(context.config.tasksFile, repo, tasks);
      const refreshed = await parseTasksFile(context.config.tasksFile);
      if (context.state.pausedRepos?.[repo]) {
        delete context.state.pausedRepos[repo];
      }
      return { parsed: refreshed, stop: false };
    }

    if (attempt >= ASK_MAX_ATTEMPTS) {
      if (context.config.askEmptySkipRepo) {
        const pauseUntil = new Date(Date.now() + context.config.askRepoCooldownMinutes * 60 * 1000).toISOString();
        context.state.pausedRepos = {
          ...(context.state.pausedRepos ?? {}),
          [repo]: pauseUntil,
        };
        logger.warn('ASK_EMPTY_3_RETRIES repo=%s action=skip pauseUntil=%s', repo, pauseUntil);
        return { parsed, stop: false, skippedRepo: repo };
      }
      logger.error('ASK_EMPTY_3_RETRIES repo=%s action=stop', repo);
      return { parsed, stop: true };
    }

    logger.warn('ASK for %s empty; backing off %d seconds before retry', repo, context.config.askRetryBackoffSeconds);
    await wait(context.config.askRetryBackoffSeconds * 1000);
  }

  return { parsed, stop: true };
}

async function runBatchWithRetries(context: LoopContext, batch: TaskBatchItem[]): Promise<BatchExecutionResult> {
  const initial = await executeWithRetry('runBatch', () => context.client.runBatch(batch));
  const successes = [...initial.successes];
  const failures = [...initial.failures];

  if (failures.length && batch.length > 1) {
    logger.warn('Batch had %d failure(s); retrying individually', failures.length);
  }

  for (const failedTask of [...failures]) {
    let resolved = false;
    for (let attempt = 1; attempt <= 3 && !resolved; attempt += 1) {
      const retryBatch: TaskBatchItem[] = [{ task: failedTask, order: 0 }];
      const retryResult = await executeWithRetry(`runBatchRetry(${failedTask.title})`, () => context.client.runBatch(retryBatch));
      if (retryResult.successes.length) {
        successes.push(...retryResult.successes);
        const index = failures.findIndex((item) => item.hash === failedTask.hash);
        if (index >= 0) {
          failures.splice(index, 1);
        }
        resolved = true;
      }
    }
  }

  const uniqueSuccessHashes = new Set(successes.map((task) => task.hash));
  const unmatchedFailures = failures.filter((task) => !uniqueSuccessHashes.has(task.hash));

  return { successes: successes.filter((task, index, array) => array.findIndex((item) => item.hash === task.hash) === index), failures: unmatchedFailures };
}

async function refreshRepoIfCompleted(context: LoopContext, repo: string): Promise<void> {
  const refreshed = await parseTasksFile(context.config.tasksFile);
  const repoSection = refreshed.repoTasks.find((entry) => entry.repo === repo);
  const remaining = repoSection?.tasks.some((task) => !task.completed);
  if (!remaining && repoSection) {
    const repoContext = buildRepoContext(repoSection);
    const { tasks } = await requestTasksForRepo(context, repo, repoContext);
    if (tasks.length) {
      await appendNewTaskList(context.config.tasksFile, repo, tasks);
    } else {
      logger.warn('ASK response empty when refreshing repo %s', repo);
    }
  }
}

async function maybeRunQa(context: LoopContext, repo: string): Promise<void> {
  const repoPath = path.resolve(process.cwd(), '..', repo);
  try {
    await fs.access(repoPath);
  } catch {
    logger.debug('QA skipped; repo path %s not accessible', repoPath);
    return;
  }

  const qa = await runQaChecks(context.config, repoPath);
  if (!qa.success) {
    logger.warn('QA checks failed for repo %s', repo);
  }
}

async function alignBranch(context: LoopContext): Promise<void> {
  if (!context.state.lastBranch) {
    return;
  }
  try {
    const active = await context.client.getActiveBranch();
    if (active === context.state.lastBranch) {
      return;
    }
    await executeWithRetry(`selectBranch(${context.state.lastBranch})`, () => context.client.selectBranch(context.state.lastBranch!));
  } catch (error) {
    logger.warn('Failed to align branch %s: %o', context.state.lastBranch, error);
  }
}

async function runIteration(context: LoopContext): Promise<IterationOutcome> {
  if (Date.now() >= context.deadline) {
    logger.info('Global timeout reached; exiting loop');
    return { shouldContinue: false };
  }

  cleanupPausedRepos(context.state);
  const pausedBeforeEnsure = buildPausedRepoSet(context.state);
  const parsed = await parseTasksFile(context.config.tasksFile);
  const ensured = await ensureTaskInventory(context, parsed, pausedBeforeEnsure);
  if (ensured.stop) {
    return { shouldContinue: false };
  }

  const pausedRepos = buildPausedRepoSet(context.state);
  const pending = findNextTasks(ensured.parsed, context.state.lastRepo, pausedRepos);
  if (!pending.length) {
    const activeRepos = ensured.parsed.repoTasks.filter((repo) =>
      repo.tasks.some((task) => !task.completed),
    );
    const unpausedActive = activeRepos.filter((repo) => !pausedRepos.has(repo.repo));
    if (activeRepos.length && !unpausedActive.length) {
      logger.info(
        'All %d active repo(s) currently paused after empty ASK responses; sleeping %d seconds',
        activeRepos.length,
        context.config.uiPollSeconds,
      );
    } else {
      logger.info('No pending tasks available after replenishment; sleeping %d seconds', context.config.uiPollSeconds);
    }
    return { shouldContinue: true, sleepSeconds: context.config.uiPollSeconds };
  }

  if (!context.state.activeBatch) {
    context.state.activeBatch = context.config.batchStart;
  }
  context.state.activeBatch = Math.min(Math.max(context.state.activeBatch, context.config.batchMin), context.config.batchMax);

  const batchSize = Math.min(context.state.activeBatch, pending.length);
  const batch = pending.slice(0, batchSize).map<TaskBatchItem>((task, index) => ({ task, order: index }));
  logger.info('Selected batch of %d task(s) for repo %s', batch.length, batch[0].task.repo);

  const result = await runBatchWithRetries(context, batch);
  const successes = result.successes;
  const failures = result.failures;

  if (successes.length) {
    await setTaskCompletion(context.config.tasksFile, successes.map((task) => ({ hash: task.hash, completed: true })));
    const merged = new Set([...context.state.processedHashes, ...successes.map((task) => task.hash)]);
    context.state.processedHashes = Array.from(merged).slice(-500);
  }

  if (successes.length) {
    const totalSuccesses = context.state.successModulo + successes.length;
    if (totalSuccesses >= context.config.prEvery) {
      const summary = `feat: codex batch ${context.state.batchCounter + 1}`;
      const descriptionLines = successes.map((task) => `- ${task.repo}: ${task.title}`);
      const description = ['## Completed tasks', ...descriptionLines].join('\n');
      const prResult = await executeWithRetry('createPr', () => context.client.createPr(summary, description));
      context.state.successModulo = totalSuccesses % context.config.prEvery;
      const branchName = prResult.branch ?? (await context.client.getActiveBranch());
      if (branchName) {
        await executeWithRetry(`selectBranch(${branchName})`, () => context.client.selectBranch(branchName));
        context.state.lastBranch = branchName;
      }
    } else {
      context.state.successModulo = totalSuccesses;
    }
  }

  if (failures.length) {
    context.state.lastRepo = failures[0].repo;
  } else if (successes.length) {
    context.state.lastRepo = successes[successes.length - 1].repo;
  }

  if (successes.length && !failures.length) {
    context.state.failureGroupStreak = 0;
    context.state.successGroupStreak += 1;
    if (context.state.successGroupStreak >= 2) {
      const next = Math.min(context.state.activeBatch + 1, context.config.batchMax);
      if (next !== context.state.activeBatch) {
        logger.info('Increasing active batch size from %d to %d', context.state.activeBatch, next);
        context.state.activeBatch = next;
      }
      context.state.successGroupStreak = 0;
    }
  } else if (failures.length) {
    context.state.successGroupStreak = 0;
    context.state.failureGroupStreak += 1;
    const next = Math.max(context.state.activeBatch - 1, context.config.batchMin);
    if (next !== context.state.activeBatch) {
      logger.warn('Reducing active batch size from %d to %d due to failures', context.state.activeBatch, next);
      context.state.activeBatch = next;
    }
  }

  if (successes.length) {
    const repo = successes[successes.length - 1].repo;
    await refreshRepoIfCompleted(context, repo);
    if (context.config.qaEnabled) {
      await maybeRunQa(context, repo);
    }
  }

  context.state.batchCounter += 1;

  return { shouldContinue: true };
}

async function orchestrate(): Promise<void> {
  const config = await loadConfig();
  if (config.pause) {
    logger.warn('PAUSE flag is enabled; orchestrator will exit without action.');
    return;
  }

  const stateStore = new StateStore(config.stateFile, config.lockFile);
  const client = await createCodexClient(config);
  const deadline = Date.now() + config.globalTimeoutSeconds * 1000;

  try {
    await stateStore.withState(async (state) => {
      const context: LoopContext = { config, client, state, deadline };
      if (!state.activeBatch) {
        state.activeBatch = config.batchStart;
      }
      await alignBranch(context);

      let keepRunning = true;
      while (keepRunning && Date.now() < deadline) {
        const iteration = await runIteration(context);
        await stateStore.write(state);
        keepRunning = iteration.shouldContinue;
        if (keepRunning && iteration.sleepSeconds) {
          await wait(iteration.sleepSeconds * 1000);
        }
      }
      if (Date.now() >= deadline) {
        logger.info('Global timeout reached; exiting orchestrator');
      }
      return { state, result: undefined };
    });
  } finally {
    await client.close();
  }
}

orchestrate().catch((error) => {
  logger.error('Unhandled error: %o', error);
  process.exitCode = 1;
});
