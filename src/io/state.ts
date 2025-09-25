import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { FileLock } from '../util/lock';
import { logger } from '../util/logger';

export interface OrchestratorState {
  lastRepo?: string;
  lastBranch?: string;
  batchCounter: number;
  successModulo: number;
  activeBatch: number;
  successGroupStreak: number;
  failureGroupStreak: number;
  processedHashes: string[];
  pausedRepos: Record<string, string>;
}

const DEFAULT_STATE: OrchestratorState = {
  batchCounter: 0,
  successModulo: 0,
  activeBatch: 0,
  successGroupStreak: 0,
  failureGroupStreak: 0,
  processedHashes: [],
  pausedRepos: {},
};

export class StateStore {
  constructor(private readonly stateFile: string, private readonly lockFile: string) {}

  async withState<T>(handler: (state: OrchestratorState) => Promise<{ state: OrchestratorState; result: T }>): Promise<T> {
    const owner = `${process.pid}-${randomUUID()}`;
    const lock = await FileLock.acquire(this.lockFile, owner);
    try {
      const current = await this.read();
      const { state, result } = await handler(current);
      await this.write(state);
      return result;
    } finally {
      await lock.release();
    }
  }

  async read(): Promise<OrchestratorState> {
    try {
      const raw = await fs.readFile(this.stateFile, 'utf8');
      const parsed = JSON.parse(raw) as Partial<OrchestratorState & { successesMod?: number; batchSize?: number }>;
      const successModulo = parsed.successModulo ?? parsed.successesMod ?? DEFAULT_STATE.successModulo;
      const activeBatch = parsed.activeBatch ?? parsed.batchSize ?? DEFAULT_STATE.activeBatch;
      return {
        ...DEFAULT_STATE,
        ...parsed,
        successModulo,
        activeBatch,
        processedHashes: parsed.processedHashes ?? [],
        pausedRepos: parsed.pausedRepos ?? {},
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.info('State file not found, initializing new state');
        return { ...DEFAULT_STATE };
      }
      throw error;
    }
  }

  async write(state: OrchestratorState): Promise<void> {
    await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2), 'utf8');
  }

  async reset(): Promise<void> {
    await this.write({ ...DEFAULT_STATE });
  }
}
