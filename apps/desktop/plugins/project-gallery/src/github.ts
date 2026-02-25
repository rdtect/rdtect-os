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

// Language color mapping (GitHub linguist colors)
export const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Svelte: '#ff3e00',
  Rust: '#dea584',
  Shell: '#89e051',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Dart: '#00B4AB',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Lua: '#000080',
  Vim: '#199f4b',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Astro: '#ff5a03',
  Nix: '#7e7eff',
  Zig: '#ec915c',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Markdown: '#083fa1',
  Jupyter: '#DA5B0B',
  WASM: '#04133b',
};

export type { GitHubRepo };
