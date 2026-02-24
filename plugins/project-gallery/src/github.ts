interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  topics: string[];
  fork: boolean;
  updated_at: string;
  homepage: string | null;
}

interface CachedRepos {
  repos: GitHubRepo[];
  timestamp: number;
}

const CACHE_KEY = 'rdtect-github-repos';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function fetchGitHubRepos(username: string = 'rdtect'): Promise<GitHubRepo[]> {
  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedRepos = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        return parsed.repos;
      }
    }
  } catch {}

  // Fetch from GitHub API
  const response = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=public`,
    { headers: { 'Accept': 'application/vnd.github.v3+json' } }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const repos: GitHubRepo[] = await response.json();
  const filtered = repos.filter(r => !r.fork);

  // Cache results
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ repos: filtered, timestamp: Date.now() }));
  } catch {}

  return filtered;
}

// Language color mapping
export const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Svelte: '#ff3e00',
  Rust: '#dea584',
  Shell: '#89e051',
  CSS: '#563d7c',
  HTML: '#e34c26',
};

export type { GitHubRepo };
