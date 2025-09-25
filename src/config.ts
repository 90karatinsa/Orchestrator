import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { logger } from './util/logger';

dotenv.config();

export type PrStrategy = 'codex' | 'github';
export type CodexDriver = 'ui' | 'api';

export interface AppConfig {
  githubOwner: string;
  githubRepo: string;
  baseBranch: string;
  prStrategy: PrStrategy;
  codexDriver: CodexDriver;
  codexUiUrl: string;
  codexUiCookiesPath?: string;
  codexUiEmail?: string;
  codexUiPassword?: string;
  tasksFile: string;
  prEvery: number;
  batchSize: number;
  uiPollSeconds: number;
  globalTimeoutSeconds: number;
  qaEnabled: boolean;
  qaBuildCmd?: string;
  qaTestCmd?: string;
  qaLintCmd?: string;
  selectors: {
    repoToggle: string;
    codeButton: string;
    branchMenu: string;
  };
  promptsDir: string;
  stateFile: string;
  lockFile: string;
  pause: boolean;
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

function parseNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive number`);
  }
  return parsed;
}

function parseBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  return ['true', '1', 'yes', 'on'].includes(raw.toLowerCase());
}

export async function loadConfig(): Promise<AppConfig> {
  const githubOwner = requireEnv('GITHUB_OWNER');
  const githubRepo = requireEnv('GITHUB_REPO');
  const baseBranch = requireEnv('BASE_BRANCH', 'main');
  const prStrategy = (process.env.PR_STRATEGY as PrStrategy | undefined) ?? 'codex';
  const codexDriver = (process.env.CODEX_DRIVER as CodexDriver | undefined) ?? 'ui';
  const codexUiUrl = requireEnv('CODEX_UI_URL', 'https://chatgpt.com/codex');
  const codexUiCookiesPath = process.env.CODEX_UI_COOKIES_JSON;
  const codexUiEmail = process.env.CODEX_UI_EMAIL;
  const codexUiPassword = process.env.CODEX_UI_PASSWORD;
  const tasksFile = requireEnv('TASKS_FILE', path.join('tasks', 'todo.md'));
  const prEvery = parseNumber('PR_EVERY', 3);
  const batchSize = parseNumber('BATCH_SIZE', 2);
  const uiPollSeconds = parseNumber('UI_POLL_SEC', 60);
  const globalTimeoutSeconds = parseNumber('GLOBAL_TIMEOUT_SEC', 900);
  const qaEnabled = parseBoolean('QA_ENABLED', false);
  const qaBuildCmd = process.env.QA_BUILD_CMD;
  const qaTestCmd = process.env.QA_TEST_CMD;
  const qaLintCmd = process.env.QA_LINT_CMD;
  const pause = parseBoolean('PAUSE', false);

  const selectors = {
    repoToggle: requireEnv('SEL_REPO_TOGGLE', '.min-w-fit > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > button:nth-child(1)'),
    codeButton: requireEnv('SEL_CODE_BUTTON', '.btn-primary'),
    branchMenu: requireEnv('SEL_BRANCH_MENU', 'div.rounded-full:nth-child(2) > button:nth-child(1)'),
  };

  const promptsDir = path.resolve(process.cwd(), 'prompts');
  const stateDir = path.resolve(process.cwd(), 'state');
  await fs.mkdir(stateDir, { recursive: true });

  const stateFile = path.join(stateDir, 'state.json');
  const lockFile = path.join(stateDir, 'state.lock');

  logger.info('Loaded configuration for repo %s/%s', githubOwner, githubRepo);

  return {
    githubOwner,
    githubRepo,
    baseBranch,
    prStrategy,
    codexDriver,
    codexUiUrl,
    codexUiCookiesPath,
    codexUiEmail,
    codexUiPassword,
    tasksFile,
    prEvery,
    batchSize,
    uiPollSeconds,
    globalTimeoutSeconds,
    qaEnabled,
    qaBuildCmd,
    qaTestCmd,
    qaLintCmd,
    selectors,
    promptsDir,
    stateFile,
    lockFile,
    pause,
  };
}
