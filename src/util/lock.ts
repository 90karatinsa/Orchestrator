import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { logger } from './logger';

export class FileLock {
  private constructor(
    private readonly lockPath: string,
    private readonly owner: string,
  ) {}

  static async acquire(lockPath: string, owner: string, retryMs = 500, maxAttempts = 40): Promise<FileLock> {
    const dir = path.dirname(lockPath);
    await fs.mkdir(dir, { recursive: true });

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const fd = await fs.open(lockPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
        await fd.writeFile(owner, 'utf8');
        await fd.close();
        logger.debug('Lock acquired at %s by %s', lockPath, owner);
        return new FileLock(lockPath, owner);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw error;
        }
        logger.debug('Lock busy at %s (attempt %d/%d)', lockPath, attempt, maxAttempts);
        await wait(retryMs);
      }
    }

    throw new Error(`Could not acquire lock at ${lockPath}`);
  }

  async release(): Promise<void> {
    try {
      const current = await fs.readFile(this.lockPath, 'utf8').catch(() => '');
      if (current.trim() === this.owner) {
        await fs.unlink(this.lockPath).catch(() => undefined);
        logger.debug('Lock released at %s', this.lockPath);
      } else {
        logger.warn('Lock at %s owned by %s, not %s', this.lockPath, current.trim(), this.owner);
      }
    } catch (error) {
      logger.error('Failed to release lock %s: %o', this.lockPath, error);
    }
  }
}
