import { setTimeout as wait } from 'node:timers/promises';
import { AppConfig } from '../config';
import { logger } from '../util/logger';
import type { BatchExecutionResult, CodexClient, PullRequestResult, TaskBatchItem } from './types';

export class CodexApiClient implements CodexClient {
  static async launch(config: AppConfig): Promise<CodexApiClient> {
    logger.warn('API driver selected but not yet implemented; operations will no-op');
    return new CodexApiClient(config);
  }

  private constructor(private readonly config: AppConfig) {}

  async runBatch(batch: TaskBatchItem[]): Promise<BatchExecutionResult> {
    logger.warn('API driver runBatch invoked with %d tasks; returning failure placeholder', batch.length);
    await wait(1000);
    return { successes: [], failures: batch.map((item) => item.task) };
  }

  async createPr(): Promise<PullRequestResult> {
    logger.warn('API driver createPr invoked but not implemented');
    return {};
  }

  async ask(): Promise<string> {
    logger.warn('API driver ask invoked but not implemented');
    return '';
  }

  async getActiveBranch(): Promise<string | undefined> {
    return undefined;
  }

  async close(): Promise<void> {
    logger.debug('API client close noop');
  }
}
