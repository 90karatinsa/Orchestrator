import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { AppConfig } from '../config';
import { logger } from '../util/logger';

const execAsync = promisify(exec);

export interface QaResult {
  command: string;
  success: boolean;
  stdout?: string;
  stderr?: string;
}

export interface QaSummary {
  success: boolean;
  results: QaResult[];
}

async function runCommand(command: string, cwd: string): Promise<QaResult> {
  logger.info('Running QA command: %s', command);
  try {
    const { stdout, stderr } = await execAsync(command, { cwd, env: process.env, shell: '/bin/bash' });
    logger.info('Command succeeded: %s', command);
    return { command, success: true, stdout, stderr };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    logger.error('Command failed: %s', command);
    return { command, success: false, stdout: err.stdout, stderr: err.stderr };
  }
}

export async function runQaChecks(config: AppConfig, repoPath: string): Promise<QaSummary> {
  if (!config.qaEnabled) {
    return { success: true, results: [] };
  }

  const commands = [config.qaBuildCmd, config.qaTestCmd, config.qaLintCmd].filter((cmd): cmd is string => Boolean(cmd && cmd.trim()));
  const results: QaResult[] = [];
  for (const command of commands) {
    const result = await runCommand(command, repoPath);
    results.push(result);
    if (!result.success) {
      return { success: false, results };
    }
  }
  return { success: true, results };
}
