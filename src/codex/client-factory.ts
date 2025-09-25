import { AppConfig } from '../config';
import { logger } from '../util/logger';
import type { CodexClient } from './types';
import { CodexUIClient } from './client-ui';
import { CodexApiClient } from './client-api';

export async function createCodexClient(config: AppConfig): Promise<CodexClient> {
  logger.info('Creating Codex client (driver=%s)', config.codexDriver);
  if (config.codexDriver === 'ui') {
    return CodexUIClient.launch(config);
  }
  return CodexApiClient.launch(config);
}
