export interface TaskItem {
  repo: string;
  heading: string;
  title: string;
  completed: boolean;
  hash: string;
  lineIndex: number;
}

export interface TaskBatchItem {
  task: TaskItem;
  order: number;
}

export interface BatchExecutionResult {
  successes: TaskItem[];
  failures: TaskItem[];
  notes?: string;
}

export interface PullRequestResult {
  url?: string;
  branch?: string;
}

export interface CodexClient {
  runBatch(batch: TaskBatchItem[]): Promise<BatchExecutionResult>;
  createPr(summary: string, description: string): Promise<PullRequestResult>;
  ask(prompt: string): Promise<string>;
  getActiveBranch(): Promise<string | undefined>;
  close(): Promise<void>;
}
