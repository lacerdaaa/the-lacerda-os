import { Injectable, signal } from '@angular/core';
import { PROFILE } from '../../data/profile';

interface GithubRepoResponse {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
}

export interface GithubProject {
  id: number;
  name: string;
  description: string | null;
  href: string;
  homepage: string | null;
  language: string | null;
  pinned: boolean;
  stars: number;
  updatedAt: string;
}

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const MAX_PROJECTS = 8;

/** Pinned repositories first (in the configured order), then the most recently pushed ones. */
export function rankRepositories(repos: GithubRepoResponse[], pinned: readonly string[]): GithubProject[] {
  const pinnedOrder = new Map(pinned.map((name, index) => [name, index]));
  const rank = (repo: GithubRepoResponse) => pinnedOrder.get(repo.name) ?? Number.POSITIVE_INFINITY;

  return repos
    .filter((repo) => !repo.fork && !repo.archived)
    .sort((a, b) => rank(a) - rank(b) || Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
    .slice(0, MAX_PROJECTS)
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      href: repo.html_url,
      homepage: repo.homepage || null,
      language: repo.language,
      pinned: pinnedOrder.has(repo.name),
      stars: repo.stargazers_count,
      updatedAt: repo.pushed_at
    }));
}

/** Fetches public repositories once per session; failures can be retried. */
@Injectable({ providedIn: 'root' })
export class GithubService {
  private readonly projectsState = signal<GithubProject[]>([]);
  private readonly stateValue = signal<LoadState>('idle');

  readonly projects = this.projectsState.asReadonly();
  readonly state = this.stateValue.asReadonly();

  async load(force = false): Promise<void> {
    const state = this.stateValue();
    if (state === 'loading' || (state === 'ready' && !force)) {
      return;
    }

    this.stateValue.set('loading');
    try {
      const response = await fetch(`https://api.github.com/users/${PROFILE.githubUser}/repos?sort=pushed&per_page=100`);
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }
      const repos = (await response.json()) as GithubRepoResponse[];
      this.projectsState.set(rankRepositories(repos, PROFILE.pinnedRepos));
      this.stateValue.set('ready');
    } catch {
      this.stateValue.set('error');
    }
  }
}
