import fs from 'node:fs/promises';
import path from 'node:path';
import { loadConfig } from './config';
import { createCodexClient } from './codex/client-factory';
import { TaskBatchItem } from './codex/types';
import { appendNewTaskList, findNextTasks, parseTasksFile, relativeTasksFilePath, setTaskCompletion } from './io/tasks-file';
import { StateStore } from './io/state';
import { runQaChecks } from './qa/gates';
import { logger } from './util/logger';

async function readPrompt(filePath: string, repo: string, context: string): Promise<string> {
  const template = await fs.readFile(filePath, 'utf8');
  return template.replace(/{{repo}}/g, repo).replace(/{{context}}/g, context);
}

function parseChecklistResponse(response: string): string[] {
  return response
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- [ ]'))
    .map((line) => line.replace(/^- \[ \] ?/, '').trim())
    .filter((line) => line.length > 0);
}

async function orchestrate(): Promise<void> {
  const config = await loadConfig();
  if (config.pause) {
    logger.warn('PAUSE flag is enabled; orchestrator will exit without action.');
    return;
  }

  const stateStore = new StateStore(config.stateFile, config.lockFile);

  await stateStore.withState(async (state) => {
    const parsedTasks = await parseTasksFile(config.tasksFile);
    const pending = findNextTasks(parsedTasks, state.lastRepo);

    if (!pending.length) {
      logger.info('No pending tasks found in %s', relativeTasksFilePath(config.tasksFile));
      return { state, result: undefined };
    }

    const batch = pending.slice(0, config.batchSize).map<TaskBatchItem>((task, index) => ({ task, order: index }));
    logger.info('Selected batch of %d task(s) for repo %s', batch.length, batch[0].task.repo);

    const client = await createCodexClient(config);
    const successes: typeof batch[number]['task'][] = [];
    const failures: typeof batch[number]['task'][] = [];

    try {
      const initialResult = await client.runBatch(batch);
      successes.push(...initialResult.successes);
      failures.push(...initialResult.failures);

      if (initialResult.failures.length && batch.length > 1) {
        logger.warn('Batch had failures; retrying each task individually');
      }

      for (const failedTask of initialResult.failures) {
        let attempt = 0;
        let resolved = false;
        while (attempt < 3 && !resolved) {
          attempt += 1;
          logger.info('Retrying task "%s" (attempt %d)', failedTask.title, attempt);
          const retryResult = await client.runBatch([{ task: failedTask, order: 0 }]);
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

      const unmatchedFailures = failures.filter((task) => successes.every((item) => item.hash !== task.hash));
      failures.length = 0;
      failures.push(...unmatchedFailures);

      if (successes.length) {
        await setTaskCompletion(config.tasksFile, successes.map((task) => ({ hash: task.hash, completed: true })));
        const merged = new Set([...state.processedHashes, ...successes.map((task) => task.hash)]);
        state.processedHashes = Array.from(merged).slice(-500);
      }

      if (successes.length) {
        const totalSuccesses = state.successesMod + successes.length;
        if (totalSuccesses >= config.prEvery) {
          const summary = `feat: codex batch ${state.batchCounter + 1}`;
          const descriptionLines = successes.map((task) => `- ${task.repo}: ${task.title}`);
          const description = ['## Completed tasks', ...descriptionLines].join('\n');
          const prResult = await client.createPr(summary, description);
          state.successesMod = totalSuccesses % config.prEvery;
          if (prResult.branch) {
            state.lastBranch = prResult.branch;
          }
        } else {
          state.successesMod = totalSuccesses;
        }
      }

      if (failures.length) {
        logger.warn('%d task(s) still failing after retries', failures.length);
        state.lastRepo = failures[0].repo;
      } else if (successes.length) {
        state.lastRepo = successes[successes.length - 1].repo;
      }

      state.batchCounter += 1;

      if (successes.length) {
        const repo = successes[successes.length - 1].repo;
        const refreshed = await parseTasksFile(config.tasksFile);
        const repoSection = refreshed.repoTasks.find((entry) => entry.repo === repo);
        const remaining = repoSection?.tasks.some((task) => !task.completed);
        if (!remaining && repoSection) {
          const promptPath = path.join(config.promptsDir, 'new_list_prompt.txt');
          const context = repoSection.tasks.map((task) => `${task.completed ? '✓' : '•'} ${task.title}`).join('\n');
          const prompt = await readPrompt(promptPath, repoSection.repo, context);
          const response = await client.ask(prompt);
          const newTasks = parseChecklistResponse(response);
          if (newTasks.length) {
            await appendNewTaskList(config.tasksFile, repoSection.repo, newTasks);
          } else {
            logger.warn('Ask response did not contain new tasks for repo %s', repoSection.repo);
          }
        }
      }

      if (successes.length) {
        const repo = successes[successes.length - 1].repo;
        const repoPath = path.resolve(process.cwd(), '..', repo);
        try {
          await fs.access(repoPath);
          const qa = await runQaChecks(config, repoPath);
          if (!qa.success) {
            logger.warn('QA checks failed for repo %s', repo);
          }
        } catch {
          logger.debug('QA skipped; repo path %s not accessible', repoPath);
        }
      }
    } finally {
      await client.close();
    }

    return { state, result: undefined };
  });
}

orchestrate().catch((error) => {
  logger.error('Unhandled error: %o', error);
  process.exitCode = 1;
});
