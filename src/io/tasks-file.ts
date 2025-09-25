import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { TaskItem } from '../codex/types';
import { logger } from '../util/logger';

export interface RepoTaskList {
  heading: string;
  repo: string;
  tasks: TaskItem[];
}

export interface TaskFile {
  repoTasks: RepoTaskList[];
  lines: string[];
}

const TASK_REGEX = /^- \[( |x|X)\] (.*)$/;
const HEADING_REGEX = /^#\s+(.*)$/;

function extractRepoName(heading: string): string {
  const normalized = heading.trim();
  const parts = normalized.split(/\s+/);
  return parts[0];
}

function computeHash(heading: string, title: string): string {
  return createHash('sha1').update(heading).update('|').update(title).digest('hex');
}

export async function parseTasksFile(filePath: string): Promise<TaskFile> {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const repoTasks: RepoTaskList[] = [];

  let currentHeading: string | undefined;
  let currentRepo: string | undefined;
  let currentList: TaskItem[] = [];

  const flush = () => {
    if (currentHeading && currentRepo) {
      repoTasks.push({ heading: currentHeading, repo: currentRepo, tasks: currentList });
    }
    currentHeading = undefined;
    currentRepo = undefined;
    currentList = [];
  };

  lines.forEach((line, index) => {
    const headingMatch = line.match(HEADING_REGEX);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[1];
      currentRepo = extractRepoName(currentHeading);
      currentList = [];
      return;
    }

    const taskMatch = line.match(TASK_REGEX);
    if (taskMatch && currentHeading && currentRepo) {
      const completed = taskMatch[1].toLowerCase() === 'x';
      const title = taskMatch[2].trim();
      const hash = computeHash(currentHeading, title);
      currentList.push({
        repo: currentRepo,
        heading: currentHeading,
        title,
        completed,
        hash,
        lineIndex: index,
      });
    }
  });
  flush();

  return { repoTasks, lines };
}

function rewriteTaskLine(line: string, completed: boolean): string {
  return line.replace(TASK_REGEX, `- [${completed ? 'x' : ' '}] $2`);
}

export async function setTaskCompletion(filePath: string, updates: Array<{ hash: string; completed: boolean }>): Promise<void> {
  if (!updates.length) {
    return;
  }
  const { lines, repoTasks } = await parseTasksFile(filePath);
  const updateMap = new Map(updates.map((item) => [item.hash, item.completed]));

  repoTasks.forEach((repo) => {
    repo.tasks.forEach((task) => {
      const desired = updateMap.get(task.hash);
      if (desired === undefined) {
        return;
      }
      const line = lines[task.lineIndex];
      lines[task.lineIndex] = rewriteTaskLine(line, desired);
    });
  });

  await fs.writeFile(filePath, `${lines.join('\n')}${lines.at(-1) === '' ? '' : '\n'}`, 'utf8');
}

function nextVersionHeading(existing: RepoTaskList[], repo: string): string {
  let maxVersion = 1;
  existing.forEach((entry) => {
    if (entry.repo !== repo) {
      return;
    }
    const match = entry.heading.match(/V(\d+)$/i);
    if (match) {
      const value = Number(match[1]);
      if (!Number.isNaN(value)) {
        maxVersion = Math.max(maxVersion, value);
      }
    } else {
      maxVersion = Math.max(maxVersion, 1);
    }
  });
  const nextVersion = maxVersion >= 1 ? maxVersion + 1 : 2;
  return `${repo} V${nextVersion}`;
}

export async function appendNewTaskList(filePath: string, repo: string, tasks: string[]): Promise<void> {
  if (!tasks.length) {
    return;
  }
  const parsed = await parseTasksFile(filePath);
  const heading = nextVersionHeading(parsed.repoTasks, repo);
  const lines: string[] = [...parsed.lines];
  if (lines.length && lines[lines.length - 1] !== '') {
    lines.push('');
  }
  lines.push(`# ${heading}`);
  tasks.forEach((task) => {
    lines.push(`- [ ] ${task}`);
  });
  await fs.writeFile(filePath, `${lines.join('\n')}${lines.at(-1) === '' ? '' : '\n'}`, 'utf8');
  logger.info('Appended new task list for %s with %d items', repo, tasks.length);
}

export function findNextTasks(parsed: TaskFile, preferredRepo?: string): TaskItem[] {
  const repos = [...parsed.repoTasks];
  if (preferredRepo) {
    const index = repos.findIndex((repo) => repo.repo === preferredRepo);
    if (index > 0) {
      const [repo] = repos.splice(index, 1);
      repos.unshift(repo);
    }
  }

  for (const repo of repos) {
    const pending = repo.tasks.filter((task) => !task.completed);
    if (pending.length) {
      return pending;
    }
  }
  return [];
}

export function relativeTasksFilePath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}
