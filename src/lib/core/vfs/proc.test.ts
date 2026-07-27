/**
 * Tests for ProcFS — the virtual /proc filesystem
 *
 * Covers:
 * - Default proc files (uptime, meminfo, version, loadavg, stat)
 * - Reactive providers (windows, apps, agents, cwd, status)
 * - Directory listing (/proc, /proc/self)
 * - Error cases (ENOENT, EROFS, ENOTDIR)
 * - Edge cases (empty providers, missing browser APIs)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * We control the browser flag via a mutable variable so we can toggle
 * it between tests without re-importing the module under test.
 */
let mockBrowser = false;

vi.mock('$app/environment', () => ({
  get browser() { return mockBrowser; },
}));

// Singleton procFS instance (lazy-initialized per describe block)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let procFS: any;

async function initProcFS() {
  const mod = await import('./proc');
  procFS = mod.procFS;
}

describe('ProcFS — Default Files', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    mockBrowser = false;
    await initProcFS();
  });

  describe('/proc/uptime', () => {
    it('returns a numeric string representing seconds', async () => {
      const buf = await procFS.read('/proc/uptime');
      const text = new TextDecoder().decode(buf);
      const uptime = Number(text);
      expect(isNaN(uptime)).toBe(false);
      expect(uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('/proc/meminfo', () => {
    it('returns MemTotal and MemFree lines on server side', async () => {
      const buf = await procFS.read('/proc/meminfo');
      const text = new TextDecoder().decode(buf);
      expect(text).toContain('MemTotal:');
      expect(text).toContain('MemFree:');
    });

    it('contains kB values', async () => {
      const buf = await procFS.read('/proc/meminfo');
      const text = new TextDecoder().decode(buf);
      expect(text).toMatch(/MemTotal:\s+\d+ kB/);
    });
  });

  describe('/proc/version', () => {
    it('contains rdtect-os identifier', async () => {
      const buf = await procFS.read('/proc/version');
      const text = new TextDecoder().decode(buf);
      expect(text).toContain('rdtect-os');
      expect(text).toContain('Platform:');
    });

    it('reports server platform when not in browser', async () => {
      const buf = await procFS.read('/proc/version');
      const text = new TextDecoder().decode(buf);
      expect(text).toContain('Platform: server');
    });
  });

  describe('/proc/loadavg', () => {
    it('returns simulated load average with correct format', async () => {
      const buf = await procFS.read('/proc/loadavg');
      const text = new TextDecoder().decode(buf);
      // Format: "X.XX X.XX X.XX N/100 1"
      expect(text).toMatch(/^\d+\.\d{2} \d+\.\d{2} \d+\.\d{2} \d+\/100 \d+$/);
    });

    it('returns 0.00 load when no windows provider is set', async () => {
      const buf = await procFS.read('/proc/loadavg');
      const text = new TextDecoder().decode(buf);
      expect(text).toMatch(/^0\.00 0\.00 0\.00/);
    });
  });

  describe('/proc/stat', () => {
    it('returns stat lines with btime and processes', async () => {
      const buf = await procFS.read('/proc/stat');
      const text = new TextDecoder().decode(buf);
      expect(text).toContain('btime');
      expect(text).toContain('processes');
      expect(text).toContain('procs_running');
      expect(text).toContain('procs_blocked');
    });

    it('includes a valid Unix timestamp in btime', async () => {
      const buf = await procFS.read('/proc/stat');
      const text = new TextDecoder().decode(buf);
      const btimeMatch = text.match(/btime (\d+)/);
      expect(btimeMatch).not.toBeNull();
      const btime = Number(btimeMatch![1]);
      // Should be reasonably recent (2024 or later)
      expect(btime).toBeGreaterThan(1700000000);
    });
  });

  describe('/proc/self/cwd', () => {
    it('returns fallback path when no provider is set', async () => {
      const buf = await procFS.read('/proc/self/cwd');
      const text = new TextDecoder().decode(buf);
      expect(text).toBe('/home/user');
    });
  });

  // Fallback status (no provider) must be tested here, before any
  // provider tests pollute the singleton procFS instance.
  describe('/proc/self/status (fallback)', () => {
    it('returns fallback minimal status when no provider set', async () => {
      const buf = await procFS.read('/proc/self/status');
      const text = new TextDecoder().decode(buf);

      expect(text).toContain('Name:   rdtect-os');
      expect(text).toContain('State:  running');
      expect(text).toContain('Uptime:');
      expect(text).toContain('s');
    });
  });
});

describe('ProcFS — Reactive Providers', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    mockBrowser = false;
    await initProcFS();
  });

  describe('Windows provider', () => {
    it('returns JSON array of windows', async () => {
      const mockWindows = [
        { id: 'win-1', appId: 'calculator', title: 'Calculator', x: 100, y: 100, width: 400, height: 300, isMinimized: false, isMaximized: false, isFocused: true },
        { id: 'win-2', appId: 'terminal', title: 'Terminal', x: 200, y: 200, width: 600, height: 400, isMinimized: true, isMaximized: false, isFocused: false },
      ];
      procFS.setWindowsProvider(() => mockWindows);

      const buf = await procFS.read('/proc/windows');
      const parsed = JSON.parse(new TextDecoder().decode(buf));

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('win-1');
      expect(parsed[0].appId).toBe('calculator');
      expect(parsed[1].isMinimized).toBe(true);
    });

    it('returns empty array when no windows', async () => {
      procFS.setWindowsProvider(() => []);

      const buf = await procFS.read('/proc/windows');
      const parsed = JSON.parse(new TextDecoder().decode(buf));
      expect(parsed).toEqual([]);
    });
  });

  describe('Apps provider', () => {
    it('returns JSON array of registered apps', async () => {
      const mockApps = [
        { id: 'calculator', title: 'Calculator', icon: '🧮', pluginType: 'native' },
        { id: 'terminal', title: 'Terminal', icon: '💻', pluginType: 'native' },
      ];
      procFS.setAppsProvider(() => mockApps);

      const buf = await procFS.read('/proc/apps');
      const parsed = JSON.parse(new TextDecoder().decode(buf));
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('calculator');
    });

    it('returns empty array when no apps registered', async () => {
      procFS.setAppsProvider(() => []);

      const buf = await procFS.read('/proc/apps');
      const parsed = JSON.parse(new TextDecoder().decode(buf));
      expect(parsed).toEqual([]);
    });
  });

  describe('Agents provider', () => {
    it('returns JSON array of agents', async () => {
      const mockAgents = [
        { id: 'agent-1', name: 'Helper', status: 'idle', model: 'claude-3', capabilities: ['file:read'], lastActiveAt: new Date('2026-07-27') },
      ];
      procFS.setAgentsProvider(() => mockAgents);

      const buf = await procFS.read('/proc/agents');
      const parsed = JSON.parse(new TextDecoder().decode(buf));
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Helper');
      expect(parsed[0].status).toBe('idle');
    });
  });

  describe('CWD provider', () => {
    it('uses provider value when set', async () => {
      procFS.setCwdProvider(() => '/home/user/Documents');

      const buf = await procFS.read('/proc/self/cwd');
      const text = new TextDecoder().decode(buf);
      expect(text).toBe('/home/user/Documents');
    });

    it('updates dynamically when provider returns different values', async () => {
      let cwd = '/home/user';
      procFS.setCwdProvider(() => cwd);

      // Initial
      const buf1 = await procFS.read('/proc/self/cwd');
      expect(new TextDecoder().decode(buf1)).toBe('/home/user');

      // Change cwd
      cwd = '/tmp';
      const buf2 = await procFS.read('/proc/self/cwd');
      expect(new TextDecoder().decode(buf2)).toBe('/tmp');
    });
  });

  describe('/proc/self/status (status provider)', () => {
    it('returns formatted key-value pairs from provider', async () => {
      procFS.setStatusProvider(() => ({
        Name: 'rdtect-os',
        State: 'running',
        Uptime: '1h 30m 0s',
        Windows: 3,
        Agents: 2,
        CWD: '/home/user',
        Auth: 'guest',
        Theme: 'dark',
      }));

      const buf = await procFS.read('/proc/self/status');
      const text = new TextDecoder().decode(buf);

      // Longest key is 'Windows' (7 chars) + 2 padding = 9 chars wide
      expect(text).toContain('Name     rdtect-os');    // 4 + 5 spaces
      expect(text).toContain('State    running');       // 5 + 4 spaces
      expect(text).toContain('Uptime   1h 30m 0s');     // 6 + 3 spaces
      expect(text).toContain('Windows  3');             // 7 + 2 spaces
      expect(text).toContain('Agents   2');             // 6 + 3 spaces
      expect(text).toContain('CWD      /home/user');    // 3 + 6 spaces
      expect(text).toContain('Auth     guest');          // 4 + 5 spaces
      expect(text).toContain('Theme    dark');           // 5 + 4 spaces
    });

    it('handles empty status record', async () => {
      procFS.setStatusProvider(() => ({}));

      const buf = await procFS.read('/proc/self/status');
      const text = new TextDecoder().decode(buf);
      expect(text).toBe('');
    });
  });
});

describe('ProcFS — Load Average with Windows', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    mockBrowser = false;
    await initProcFS();
  });

  it('increases load with more windows', async () => {
    procFS.setWindowsProvider(() => Array(10).fill(null).map((_, i) => ({
      id: `win-${i}`,
      appId: 'app',
      title: `Window ${i}`,
      x: 0, y: 0, width: 400, height: 300,
      isMinimized: false, isMaximized: false, isFocused: false,
    })));

    const buf = await procFS.read('/proc/loadavg');
    const text = new TextDecoder().decode(buf);
    // 10 windows * 0.1 = 1.00 load
    expect(text).toMatch(/^1\.00 1\.00 1\.00 10\/100 1$/);
  });
});

describe('ProcFS — Directory Listing', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    mockBrowser = false;
    await initProcFS();
  });

  describe('/proc directory', () => {
    it('lists top-level entries', async () => {
      const entries = procFS.readdir('/proc');

      const names = entries.map((e: { name: string }) => e.name);
      expect(names).toContain('uptime');
      expect(names).toContain('meminfo');
      expect(names).toContain('version');
      expect(names).toContain('loadavg');
      expect(names).toContain('stat');
      expect(names).toContain('self');
      expect(names).toContain('agents');
      expect(names).toContain('windows');
      expect(names).toContain('apps');
    });

    it('all entries have correct permissions (read-only)', async () => {
      const entries = procFS.readdir('/proc');

      for (const entry of entries as Array<{ type: string; mode: number }>) {
        if (entry.type === 'directory') {
          expect(entry.mode).toBe(0o555);
        } else {
          expect(entry.mode).toBe(0o444);
        }
      }
    });
  });

  describe('/proc/self directory', () => {
    it('lists self entries', async () => {
      const entries = procFS.readdir('/proc/self');

      const names = entries.map((e: { name: string }) => e.name);
      expect(names).toContain('cwd');
      expect(names).toContain('status');
    });
  });
});

describe('ProcFS — stat()', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    mockBrowser = false;
    await initProcFS();
  });

  it('returns directory entry for /proc', async () => {
    const stat = procFS.stat('/proc');
    expect(stat.name).toBe('proc');
    expect(stat.type).toBe('proc');
    expect(stat.mode).toBe(0o555);
    expect(stat.uid).toBe('root');
  });

  it('returns directory entry for /proc/self', async () => {
    const stat = procFS.stat('/proc/self');
    expect(stat.name).toBe('self');
    expect(stat.type).toBe('directory');
    expect(stat.mode).toBe(0o555);
    expect(stat.uid).toBe('user');
  });

  it('returns file entry with correct size for /proc/uptime', async () => {
    const stat = procFS.stat('/proc/uptime');
    expect(stat.name).toBe('uptime');
    expect(stat.type).toBe('proc');
    expect(stat.mode).toBe(0o444);
    expect(stat.size).toBeGreaterThan(0);
  });
});

describe('ProcFS — Error Cases', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    mockBrowser = false;
    await initProcFS();
  });

  describe('ENOENT', () => {
    it('throws on reading non-existent proc file', async () => {
      await expect(procFS.read('/proc/nonexistent')).rejects.toThrow('ENOENT');
    });

    it('throws on stat for non-existent proc file', async () => {
      expect(() => procFS.stat('/proc/nonexistent')).toThrow('ENOENT');
    });
  });

  describe('EROFS', () => {
    it('throws on write attempt', async () => {
      await expect(procFS.write('/proc/uptime', new TextEncoder().encode('0').buffer)).rejects.toThrow('EROFS');
    });
  });

  describe('ENOTDIR', () => {
    it('throws on readdir for a file path', async () => {
      expect(() => procFS.readdir('/proc/uptime')).toThrow('ENOTDIR');
    });
  });

  describe('exists()', () => {
    it('returns true for /proc', async () => {
      expect(procFS.exists('/proc')).toBe(true);
    });

    it('returns true for /proc/self', async () => {
      expect(procFS.exists('/proc/self')).toBe(true);
    });

    it('returns true for existing proc files', async () => {
      expect(procFS.exists('/proc/uptime')).toBe(true);
      expect(procFS.exists('/proc/meminfo')).toBe(true);
      expect(procFS.exists('/proc/version')).toBe(true);
      expect(procFS.exists('/proc/loadavg')).toBe(true);
      expect(procFS.exists('/proc/stat')).toBe(true);
      expect(procFS.exists('/proc/self/cwd')).toBe(true);
      expect(procFS.exists('/proc/self/status')).toBe(true);
    });

    it('returns false for non-existent proc files', async () => {
      expect(procFS.exists('/proc/void')).toBe(false);
    });
  });
});

describe('ProcFS — handles()', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    mockBrowser = false;
    await initProcFS();
  });

  it('returns true for /proc paths', async () => {
    expect(procFS.handles('/proc')).toBe(true);
    expect(procFS.handles('/proc/uptime')).toBe(true);
    expect(procFS.handles('/proc/self/cwd')).toBe(true);
  });

  it('returns false for non-/proc paths', async () => {
    expect(procFS.handles('/home')).toBe(false);
    expect(procFS.handles('/dev/null')).toBe(false);
    expect(procFS.handles('/tmp')).toBe(false);
  });
});
