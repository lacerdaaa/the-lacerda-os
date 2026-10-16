import { rankRepositories } from './github.service';

const repo = (name: string, pushedAt: string, extra: Partial<{ fork: boolean; archived: boolean }> = {}) => ({
  id: name.length,
  name,
  description: null,
  html_url: `https://github.com/x/${name}`,
  homepage: '',
  language: 'TypeScript',
  stargazers_count: 0,
  fork: false,
  archived: false,
  pushed_at: pushedAt,
  ...extra
});

describe('rankRepositories', () => {
  it('puts pinned repos first, then the most recent, skipping forks and archived ones', () => {
    const ranked = rankRepositories(
      [
        repo('old', '2024-01-01T00:00:00Z'),
        repo('fresh', '2026-01-01T00:00:00Z'),
        repo('pin-b', '2023-01-01T00:00:00Z'),
        repo('pin-a', '2022-01-01T00:00:00Z'),
        repo('forked', '2026-05-01T00:00:00Z', { fork: true }),
        repo('archived', '2026-05-01T00:00:00Z', { archived: true })
      ],
      ['pin-a', 'pin-b']
    );

    expect(ranked.map((project) => project.name)).toEqual(['pin-a', 'pin-b', 'fresh', 'old']);
    expect(ranked[0].pinned).toBe(true);
    expect(ranked[0].homepage).toBeNull();
  });
});
