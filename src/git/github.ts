import { logger } from '../util/logger';

export interface PullRequestSummary {
  number: number;
  title: string;
  htmlUrl: string;
  headRef: string;
}

export async function fetchOpenPullRequests(owner: string, repo: string, token?: string): Promise<PullRequestSummary[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=20`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'codex-orchestrator',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    logger.warn('Failed to fetch PRs from GitHub: %s', response.statusText);
    return [];
  }

  const payload = (await response.json()) as Array<{ number: number; title: string; html_url: string; head: { ref: string } }>;
  return payload.map((item) => ({
    number: item.number,
    title: item.title,
    htmlUrl: item.html_url,
    headRef: item.head.ref,
  }));
}
