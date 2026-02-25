<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { wm } from "$lib/shell";
  import { PUBLIC_PYTHON_API_URL } from '$env/static/public';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // === Types ===
  interface NetworkRequest {
    name: string;
    duration: number;
    size: number;
    type: string;
    timestamp: number;
  }

  interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }

  interface AppUsage {
    name: string;
    usage: number;
    color: string;
  }

  // === Tabs ===
  type TabId = "performance" | "memory" | "network" | "apps" | "plugins" | "server";
  let activeTab = $state<TabId>("performance");

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "performance", label: "Performance", icon: "cpu" },
    { id: "memory", label: "Memory", icon: "memory" },
    { id: "network", label: "Network", icon: "network" },
    { id: "apps", label: "Apps", icon: "apps" },
    { id: "plugins", label: "Plugins", icon: "plugins" },
    { id: "server", label: "Server", icon: "server" },
  ];

  // === Performance State ===
  let fps = $state(0);
  let fpsHistory = $state<number[]>([]);
  let domNodes = $state(0);
  let eventListeners = $state(0);

  // === Memory State ===
  let memoryUsed = $state(0);
  let memoryTotal = $state(0);
  let memoryHistory = $state<number[]>([]);

  // === Network State ===
  let networkRequests = $state<NetworkRequest[]>([]);
  let bandwidth = $state(0);
  let networkIn = $state(125);
  let networkOut = $state(48);

  // === Apps State ===
  let windowCount = $state(0);
  let totalWindowsOpened = $state(0);
  let zIndexStack = $state<{ id: string; title: string; zIndex: number }[]>([]);
  let sessionStart = $state(Date.now());
  let currentTime = $state(Date.now());
  let appsOpenedToday = $state(12);
  let mostUsedApps = $state<AppUsage[]>([
    { name: "Terminal", usage: 85, color: "#6366f1" },
    { name: "AI Chat", usage: 72, color: "#8b5cf6" },
    { name: "Calculator", usage: 58, color: "#a855f7" },
    { name: "Notes", usage: 45, color: "#c084fc" },
    { name: "Weather", usage: 32, color: "#d8b4fe" },
  ]);

  // === Plugins State ===
  let pluginsLoaded = $state(14);
  let federationConnections = $state(2);
  let wasmModules = $state(2);
  let iframePlugins = $state(3);
  let nativePlugins = $state(7);

  // === Server State ===
  let serverMetrics = $state<any>(null);
  let serverLoading = $state(false);
  let serverError = $state(false);

  async function fetchServerMetrics() {
    serverLoading = true;
    serverError = false;
    try {
      const res = await fetch(`${PUBLIC_PYTHON_API_URL}/api/vps/metrics`);
      if (!res.ok) throw new Error('API error');
      serverMetrics = await res.json();
    } catch {
      serverError = true;
    } finally {
      serverLoading = false;
    }
  }

  function formatServerBytes(bytes: number): string {
    if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    return (bytes / 1e6).toFixed(0) + ' MB';
  }

  function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  }

  // Tracking variables
  let frameCount = 0;
  let lastFpsTime = performance.now();
  let animationFrameId: number;
  let intervals: ReturnType<typeof setInterval>[] = [];
  let perfObserver: PerformanceObserver | null = null;
  let sessionWindowsOpened = 0;

  // === Derived values ===
  const fpsColor = $derived(
    fps >= 50 ? "#22c55e" : fps >= 30 ? "#eab308" : "#ef4444"
  );

  const memoryPercent = $derived(
    memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0
  );

  const memoryColor = $derived(
    memoryPercent < 50 ? "#22c55e" : memoryPercent < 80 ? "#eab308" : "#ef4444"
  );

  const memoryTrend = $derived(() => {
    if (memoryHistory.length < 2) return "stable";
    const recent = memoryHistory.slice(-5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const last = memoryHistory[memoryHistory.length - 1];
    if (last > avg * 1.1) return "up";
    if (last < avg * 0.9) return "down";
    return "stable";
  });

  const sessionDuration = $derived(() => {
    const diff = currentTime - sessionStart;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  });

  const memoryArcPath = $derived(() => {
    const radius = 40;
    const cx = 50;
    const cy = 50;
    const angle = (memoryPercent / 100) * 360;
    const radians = (angle - 90) * (Math.PI / 180);
    const x = cx + radius * Math.cos(radians);
    const y = cy + radius * Math.sin(radians);
    const largeArc = angle > 180 ? 1 : 0;
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y}`;
  });

  // === Helper functions ===
  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function formatDuration(ms: number): string {
    if (ms < 1) return "<1ms";
    if (ms < 1000) return Math.round(ms) + "ms";
    return (ms / 1000).toFixed(2) + "s";
  }

  function getStatusColor(value: number): string {
    if (value < 50) return "#22c55e";
    if (value < 75) return "#f59e0b";
    return "#ef4444";
  }

  function getResourceType(entry: PerformanceResourceTiming): string {
    const url = entry.name;
    if (url.endsWith(".js")) return "JS";
    if (url.endsWith(".css")) return "CSS";
    if (url.endsWith(".woff") || url.endsWith(".woff2") || url.endsWith(".ttf"))
      return "Font";
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url)) return "Img";
    if (url.endsWith(".json")) return "JSON";
    if (
      entry.initiatorType === "fetch" ||
      entry.initiatorType === "xmlhttprequest"
    )
      return "XHR";
    return entry.initiatorType || "Other";
  }

  function getFileName(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      const path = urlObj.pathname;
      const fileName = path.split("/").pop() || path;
      return fileName.length > 30
        ? fileName.substring(0, 27) + "..."
        : fileName;
    } catch {
      return url.substring(0, 30);
    }
  }

  // === FPS tracking ===
  function trackFps() {
    frameCount++;
    const now = performance.now();
    const elapsed = now - lastFpsTime;

    if (elapsed >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsed);
      fpsHistory = [...fpsHistory.slice(-59), fps];
      frameCount = 0;
      lastFpsTime = now;
    }

    animationFrameId = requestAnimationFrame(trackFps);
  }

  // === Metrics collection ===
  function collectMetrics() {
    // Memory (Chrome only)
    const perf = performance as unknown as { memory?: MemoryInfo };
    if (perf.memory) {
      const mem = perf.memory;
      memoryUsed = mem.usedJSHeapSize;
      memoryTotal = mem.jsHeapSizeLimit;
      memoryHistory = [...memoryHistory.slice(-59), memoryUsed];
    }

    // DOM nodes
    domNodes = document.querySelectorAll("*").length;

    // Estimate event listeners
    const elementsWithEvents = document.querySelectorAll(
      "[onclick], [onchange], [onsubmit], [onkeydown], [onkeyup], [onmouseover], [onmouseout], [onfocus], [onblur]"
    );
    eventListeners = elementsWithEvents.length + wm.windows.length * 10;

    // Window manager stats
    windowCount = wm.windows.length;

    // Track total windows opened this session
    if (wm.windows.length > sessionWindowsOpened) {
      totalWindowsOpened += wm.windows.length - sessionWindowsOpened;
    }
    sessionWindowsOpened = wm.windows.length;

    // Z-index stack
    zIndexStack = wm.windows
      .filter((w) => !w.isMinimized)
      .map((w) => ({ id: w.id, title: w.title, zIndex: w.zIndex }))
      .sort((a, b) => b.zIndex - a.zIndex)
      .slice(0, 5);
  }

  // === Network tracking ===
  function setupNetworkObserver() {
    try {
      perfObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];

        for (const entry of entries) {
          const request: NetworkRequest = {
            name: getFileName(entry.name),
            duration: entry.duration,
            size: entry.transferSize || 0,
            type: getResourceType(entry),
            timestamp: Date.now(),
          };

          networkRequests = [...networkRequests.slice(-19), request];

          const recentRequests = networkRequests.filter(
            (r) => Date.now() - r.timestamp < 5000
          );
          const totalBytes = recentRequests.reduce((acc, r) => acc + r.size, 0);
          const totalTime = recentRequests.length > 0 ? 5 : 1;
          bandwidth = totalBytes / totalTime;
        }
      });

      perfObserver.observe({ type: "resource", buffered: true });
    } catch (e) {
      console.warn("PerformanceObserver not supported:", e);
    }
  }

  // === Sparkline SVG generator ===
  function generateSparkline(
    data: number[],
    width: number,
    height: number,
    color: string
  ): string {
    if (data.length === 0) return "";

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1 || 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return `
      <svg width="${width}" height="${height}" class="sparkline">
        <polyline
          fill="none"
          stroke="${color}"
          stroke-width="1.5"
          points="${points}"
        />
      </svg>
    `;
  }

  // === Effects for real-time updates ===
  $effect(() => {
    const interval = setInterval(() => {
      currentTime = Date.now();
    }, 1000);
    intervals.push(interval);
    return () => clearInterval(interval);
  });

  $effect(() => {
    const interval = setInterval(() => {
      networkIn = Math.max(
        50,
        Math.min(500, networkIn + (Math.random() - 0.5) * 100)
      );
      networkOut = Math.max(
        20,
        Math.min(200, networkOut + (Math.random() - 0.5) * 50)
      );
    }, 300);
    intervals.push(interval);
    return () => clearInterval(interval);
  });

  // === Server tab auto-refresh ===
  $effect(() => {
    if (activeTab !== 'server') return;
    fetchServerMetrics();
    const interval = setInterval(fetchServerMetrics, 30000);
    return () => clearInterval(interval);
  });

  // === Lifecycle ===
  onMount(() => {
    animationFrameId = requestAnimationFrame(trackFps);
    collectMetrics();
    const metricsInterval = setInterval(collectMetrics, 500);
    intervals.push(metricsInterval);
    setupNetworkObserver();
    totalWindowsOpened = wm.windows.length;

  });

  onDestroy(() => {
    cancelAnimationFrame(animationFrameId);
    intervals.forEach(clearInterval);
    if (perfObserver) {
      perfObserver.disconnect();
    }
  });
</script>

<div class="system-monitor">
  <!-- Header -->
  <div class="header">
    <div class="header-title">
      <span class="header-icon">&#x1F4CA;</span>
      <span>System Monitor</span>
    </div>
    <div class="live-indicator">
      <span class="live-dot"></span>
      <span>LIVE</span>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="tab-nav">
    {#each tabs as tab}
      <button
        class="tab-btn"
        class:active={activeTab === tab.id}
        onclick={() => (activeTab = tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab Content -->
  <div class="tab-content">
    <!-- Performance Tab -->
    {#if activeTab === "performance"}
      <div class="panel">
        <h3 class="panel-title">FPS & Performance</h3>

        <!-- FPS Metric -->
        <div class="metric-row">
          <div class="metric-label">
            <span class="metric-name">FPS</span>
            <span class="metric-value" style="color: {fpsColor}">{fps}</span>
          </div>
          <div class="sparkline-container">
            {@html generateSparkline(fpsHistory, 120, 28, fpsColor)}
          </div>
          <div class="status-dot" style="background: {fpsColor}"></div>
        </div>

        <!-- DOM Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">&#x1F4C4;</span>
            <div class="stat-info">
              <span class="stat-value">{domNodes.toLocaleString()}</span>
              <span class="stat-label">DOM Nodes</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">&#x1F50A;</span>
            <div class="stat-info">
              <span class="stat-value">~{eventListeners}</span>
              <span class="stat-label">Event Listeners</span>
            </div>
          </div>
        </div>

        <!-- Session Info -->
        <div class="session-card">
          <div class="session-row">
            <span class="session-icon">&#x23F1;</span>
            <span class="session-label">Session Duration</span>
            <span class="session-value mono">{sessionDuration()}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Memory Tab -->
    {#if activeTab === "memory"}
      <div class="panel">
        <h3 class="panel-title">Memory Usage</h3>

        <div class="memory-display">
          <!-- Memory Gauge -->
          <div class="memory-gauge">
            <svg class="memory-chart" viewBox="0 0 100 100">
              <circle
                class="memory-bg"
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#334155"
                stroke-width="8"
              />
              <path
                class="memory-arc"
                d={memoryArcPath()}
                fill="none"
                stroke="url(#memoryGradient)"
                stroke-width="8"
                stroke-linecap="round"
              />
              <defs>
                <linearGradient
                  id="memoryGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stop-color="#6366f1" />
                  <stop offset="100%" stop-color="#a855f7" />
                </linearGradient>
              </defs>
              <text
                x="50"
                y="50"
                class="memory-text"
                text-anchor="middle"
                dominant-baseline="middle"
              >
                {memoryPercent.toFixed(0)}%
              </text>
            </svg>
          </div>

          <!-- Memory Details -->
          <div class="memory-details">
            <div class="memory-row">
              <span class="memory-label">Used</span>
              <span class="memory-value" style="color: {memoryColor}">
                {formatBytes(memoryUsed)}
              </span>
            </div>
            <div class="memory-row">
              <span class="memory-label">Total</span>
              <span class="memory-value">{formatBytes(memoryTotal)}</span>
            </div>
            <div class="memory-row">
              <span class="memory-label">Trend</span>
              <div
                class="trend-indicator"
                class:up={memoryTrend() === "up"}
                class:down={memoryTrend() === "down"}
              >
                {#if memoryTrend() === "up"}
                  &#x2191;
                {:else if memoryTrend() === "down"}
                  &#x2193;
                {:else}
                  &#x2014;
                {/if}
              </div>
            </div>
          </div>
        </div>

        {#if memoryTotal === 0}
          <div class="warning-text">Memory API not available (Chrome only)</div>
        {/if}

        <!-- Memory History Sparkline -->
        <div class="sparkline-section">
          <span class="sparkline-label">Memory History</span>
          <div class="sparkline-large">
            {@html generateSparkline(memoryHistory, 280, 40, memoryColor)}
          </div>
        </div>
      </div>
    {/if}

    <!-- Network Tab -->
    {#if activeTab === "network"}
      <div class="panel">
        <h3 class="panel-title">Network Activity</h3>

        <!-- Bandwidth Stats -->
        <div class="network-stats">
          <div class="network-stat-card download">
            <span class="network-arrow">&#x2193;</span>
            <div class="network-stat-info">
              <span class="network-stat-label">Download</span>
              <span class="network-stat-value"
                >{formatBytes(networkIn * 1024)}/s</span
              >
            </div>
            <div class="network-bar">
              <div
                class="network-fill in"
                style:width="{(networkIn / 500) * 100}%"
              ></div>
            </div>
          </div>
          <div class="network-stat-card upload">
            <span class="network-arrow">&#x2191;</span>
            <div class="network-stat-info">
              <span class="network-stat-label">Upload</span>
              <span class="network-stat-value"
                >{formatBytes(networkOut * 1024)}/s</span
              >
            </div>
            <div class="network-bar">
              <div
                class="network-fill out"
                style:width="{(networkOut / 200) * 100}%"
              ></div>
            </div>
          </div>
        </div>

        <!-- Request Log -->
        <div class="request-section">
          <div class="request-header">
            <span class="request-title">Recent Requests</span>
            <span class="bandwidth-badge">{formatBytes(bandwidth)}/s</span>
          </div>
          <div class="network-list">
            {#if networkRequests.length === 0}
              <div class="empty-state">No network requests yet</div>
            {:else}
              {#each networkRequests
                .slice()
                .reverse() as request, idx (idx + '-' + request.timestamp + '-' + request.name)}
                <div class="network-item">
                  <span
                    class="request-type"
                    class:js={request.type === "JS"}
                    class:css={request.type === "CSS"}
                    class:img={request.type === "Img"}
                    class:xhr={request.type === "XHR"}
                  >
                    {request.type}
                  </span>
                  <span class="request-name">{request.name}</span>
                  <span class="request-size">{formatBytes(request.size)}</span>
                  <span class="request-duration"
                    >{formatDuration(request.duration)}</span
                  >
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Apps Tab -->
    {#if activeTab === "apps"}
      <div class="panel">
        <h3 class="panel-title">App Usage</h3>

        <!-- Window Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">&#x1FA9F;</span>
            <div class="stat-info">
              <span class="stat-value highlight">{windowCount}</span>
              <span class="stat-label">Active Windows</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">&#x1F4F1;</span>
            <div class="stat-info">
              <span class="stat-value">{totalWindowsOpened}</span>
              <span class="stat-label">Total Opened</span>
            </div>
          </div>
        </div>

        <!-- Most Used Apps -->
        <div class="apps-chart">
          <span class="chart-title">Most Used Apps</span>
          <div class="bars-container">
            {#each mostUsedApps as app}
              <div class="bar-row">
                <span class="bar-label">{app.name}</span>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    style:width="{app.usage}%"
                    style:background={app.color}
                  ></div>
                </div>
                <span class="bar-value">{app.usage}%</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Z-Index Stack -->
        <div class="zindex-section">
          <span class="section-label">Window Stack (Top 5)</span>
          <div class="zindex-stack">
            {#if zIndexStack.length === 0}
              <div class="empty-state">No visible windows</div>
            {:else}
              {#each zIndexStack as win, i (win.id)}
                <div class="zindex-item" class:top={i === 0}>
                  <span class="zindex-rank">#{i + 1}</span>
                  <span class="zindex-title">{win.title}</span>
                  <span class="zindex-value">z:{win.zIndex}</span>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Plugins Tab -->
    {#if activeTab === "plugins"}
      <div class="panel">
        <h3 class="panel-title">Plugin Statistics</h3>

        <!-- Plugin Type Cards -->
        <div class="plugin-grid">
          <div class="plugin-card native">
            <span class="plugin-icon">&#x1F4E6;</span>
            <div class="plugin-info">
              <span class="plugin-value">{nativePlugins}</span>
              <span class="plugin-label">Native</span>
            </div>
          </div>
          <div class="plugin-card iframe">
            <span class="plugin-icon">&#x1F310;</span>
            <div class="plugin-info">
              <span class="plugin-value">{iframePlugins}</span>
              <span class="plugin-label">IFrame</span>
            </div>
          </div>
          <div class="plugin-card federation">
            <span class="plugin-icon">&#x1F517;</span>
            <div class="plugin-info">
              <span class="plugin-value">{federationConnections}</span>
              <span class="plugin-label">Federation</span>
            </div>
          </div>
          <div class="plugin-card wasm">
            <span class="plugin-icon">&#x26A1;</span>
            <div class="plugin-info">
              <span class="plugin-value">{wasmModules}</span>
              <span class="plugin-label">WASM</span>
            </div>
          </div>
        </div>

        <!-- Total Plugins Summary -->
        <div class="total-plugins">
          <div class="total-label">Total Plugins Loaded</div>
          <div class="total-value">{pluginsLoaded}</div>
          <div class="total-bar">
            <div
              class="total-segment native"
              style:width="{(nativePlugins / pluginsLoaded) * 100}%"
            ></div>
            <div
              class="total-segment iframe"
              style:width="{(iframePlugins / pluginsLoaded) * 100}%"
            ></div>
            <div
              class="total-segment federation"
              style:width="{(federationConnections / pluginsLoaded) * 100}%"
            ></div>
            <div
              class="total-segment wasm"
              style:width="{(wasmModules / pluginsLoaded) * 100}%"
            ></div>
          </div>
          <div class="total-legend">
            <span class="legend-item native">Native</span>
            <span class="legend-item iframe">IFrame</span>
            <span class="legend-item federation">Federation</span>
            <span class="legend-item wasm">WASM</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Server Tab -->
    {#if activeTab === "server"}
      <div class="panel">
        {#if serverError}
          <div class="server-error">
            <span class="server-error-icon">&#x26A0;</span>
            <h3 class="server-error-title">VPS API Offline</h3>
            <p class="server-error-text">Check api.rdtect.com</p>
            <button class="server-retry-btn" onclick={fetchServerMetrics}>
              Retry
            </button>
          </div>
        {:else if serverLoading && !serverMetrics}
          <div class="server-loading">
            <span class="live-dot"></span>
            <span>Loading server metrics...</span>
          </div>
        {:else if serverMetrics}
          <!-- VPS Status -->
          <div class="server-status-row">
            <div class="server-status-item">
              <span class="server-status-label">Uptime</span>
              <span class="server-status-value mono">{formatUptime(serverMetrics.uptime_seconds)}</span>
            </div>
            <div class="server-status-item">
              <span class="server-status-label">Status</span>
              <span class="server-status-badge running">
                <span class="status-dot-inline"></span>
                running
              </span>
            </div>
          </div>

          <!-- CPU Gauge -->
          <h3 class="panel-title" style="margin-top: 1rem;">CPU</h3>
          <div class="memory-display">
            <div class="memory-gauge">
              <svg class="memory-chart" viewBox="0 0 100 100">
                <circle
                  class="memory-bg"
                  cx="50" cy="50" r="40"
                  fill="none" stroke="#334155" stroke-width="8"
                />
                {@const cpuAngle = (serverMetrics.cpu_percent / 100) * 360}
                {@const cpuRadians = (cpuAngle - 90) * (Math.PI / 180)}
                {@const cpuX = 50 + 40 * Math.cos(cpuRadians)}
                {@const cpuY = 50 + 40 * Math.sin(cpuRadians)}
                {@const cpuLargeArc = cpuAngle > 180 ? 1 : 0}
                <path
                  d="M 50 10 A 40 40 0 {cpuLargeArc} 1 {cpuX} {cpuY}"
                  fill="none"
                  stroke={serverMetrics.cpu_percent < 50 ? '#22c55e' : serverMetrics.cpu_percent < 80 ? '#eab308' : '#ef4444'}
                  stroke-width="8"
                  stroke-linecap="round"
                />
                <text x="50" y="50" class="memory-text" text-anchor="middle" dominant-baseline="middle">
                  {serverMetrics.cpu_percent.toFixed(0)}%
                </text>
              </svg>
            </div>
            <div class="memory-details">
              <div class="memory-row">
                <span class="memory-label">Usage</span>
                <span class="memory-value" style="color: {serverMetrics.cpu_percent < 50 ? '#22c55e' : serverMetrics.cpu_percent < 80 ? '#eab308' : '#ef4444'}">
                  {serverMetrics.cpu_percent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <!-- Memory -->
          <h3 class="panel-title" style="margin-top: 1rem;">Memory</h3>
          {@const memUsed = serverMetrics.memory.used}
          {@const memTotal = serverMetrics.memory.total}
          {@const memPct = memTotal > 0 ? (memUsed / memTotal) * 100 : 0}
          <div class="server-bar-section">
            <div class="server-bar-track">
              <div class="server-bar-fill" style:width="{memPct}%" style:background={memPct < 50 ? '#22c55e' : memPct < 80 ? '#eab308' : '#ef4444'}></div>
            </div>
            <span class="server-bar-label">{formatServerBytes(memUsed)} used of {formatServerBytes(memTotal)} ({memPct.toFixed(0)}%)</span>
          </div>

          <!-- Disk -->
          <h3 class="panel-title" style="margin-top: 1rem;">Disk</h3>
          {@const diskUsed = serverMetrics.disk.used}
          {@const diskTotal = serverMetrics.disk.total}
          {@const diskPct = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0}
          <div class="server-bar-section">
            <div class="server-bar-track">
              <div class="server-bar-fill" style:width="{diskPct}%" style:background={diskPct < 50 ? '#22c55e' : diskPct < 80 ? '#eab308' : '#ef4444'}></div>
            </div>
            <span class="server-bar-label">{formatServerBytes(diskUsed)} used of {formatServerBytes(diskTotal)} ({diskPct.toFixed(0)}%)</span>
          </div>

          <!-- Docker Containers -->
          {#if serverMetrics.docker?.containers}
            <h3 class="panel-title" style="margin-top: 1rem;">Containers ({serverMetrics.docker.containers.length})</h3>
            <div class="server-container-list">
              {#each serverMetrics.docker.containers as container}
                <div class="server-container-item">
                  <span class="server-container-name">{container.name}</span>
                  <span class="server-container-image">{container.image}</span>
                  <span class="server-container-badge" class:running={container.status === 'running'} class:stopped={container.status !== 'running'}>
                    {container.status}
                  </span>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Ollama -->
          {#if serverMetrics.ollama}
            <div class="server-ollama-section">
              <div class="server-ollama-header">
                <h3 class="panel-title" style="margin: 0;">Ollama</h3>
                <span class="server-container-badge" class:running={serverMetrics.ollama.available} class:stopped={!serverMetrics.ollama.available}>
                  {serverMetrics.ollama.available ? 'available' : 'offline'}
                </span>
              </div>
              {#if serverMetrics.ollama.models?.length > 0}
                <div class="server-model-chips">
                  {#each serverMetrics.ollama.models as model}
                    <span class="server-model-chip">{model}</span>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}

          <!-- Refresh Button -->
          <button class="server-refresh-btn" onclick={fetchServerMetrics} disabled={serverLoading}>
            {serverLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="footer">
    <span class="refresh-info">Auto-refresh: 500ms</span>
  </div>
</div>

<style>
  .system-monitor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    font-size: 12px;
    color: #e2e8f0;
    overflow: hidden;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(99, 102, 241, 0.1);
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
    backdrop-filter: blur(10px);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .header-icon {
    font-size: 1.1rem;
  }

  .live-indicator {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #22c55e;
    text-transform: uppercase;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
    box-shadow: 0 0 8px #22c55e;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.85);
    }
  }

  /* Tab Navigation */
  .tab-nav {
    display: flex;
    padding: 0.5rem;
    gap: 0.25rem;
    background: rgba(15, 23, 42, 0.6);
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
  }

  .tab-btn {
    flex: 1;
    padding: 0.5rem 0.25rem;
    border: none;
    background: transparent;
    color: #94a3b8;
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tab-btn:hover {
    background: rgba(99, 102, 241, 0.1);
    color: #e2e8f0;
  }

  .tab-btn.active {
    background: rgba(99, 102, 241, 0.2);
    color: #6366f1;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
  }

  /* Tab Content */
  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .tab-content::-webkit-scrollbar {
    width: 4px;
  }

  .tab-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .tab-content::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 2px;
  }

  /* Panel */
  .panel {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 12px;
    padding: 1rem;
    backdrop-filter: blur(10px);
  }

  .panel-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin-bottom: 1rem;
  }

  /* Metric Row */
  .metric-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .metric-label {
    flex: 1;
    min-width: 0;
  }

  .metric-name {
    display: block;
    color: #8b949e;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .metric-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  /* Sparkline */
  .sparkline-container {
    width: 120px;
    height: 28px;
    flex-shrink: 0;
  }

  :global(.sparkline) {
    display: block;
  }

  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 8px currentColor;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(15, 23, 42, 0.4);
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }

  .stat-icon {
    font-size: 1.25rem;
    opacity: 0.8;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .stat-value.highlight {
    color: #6366f1;
  }

  .stat-label {
    font-size: 0.6rem;
    color: #64748b;
    text-transform: uppercase;
  }

  /* Session Card */
  .session-card {
    background: rgba(15, 23, 42, 0.4);
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }

  .session-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .session-icon {
    font-size: 1.25rem;
  }

  .session-label {
    flex: 1;
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
  }

  .session-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #6366f1;
  }

  .mono {
    font-family: "SF Mono", Monaco, Consolas, monospace;
  }

  /* Memory Display */
  .memory-display {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  .memory-gauge {
    flex-shrink: 0;
  }

  .memory-chart {
    width: 100px;
    height: 100px;
  }

  .memory-arc {
    filter: drop-shadow(0 0 4px #6366f1);
    transition: d 0.5s ease;
  }

  .memory-text {
    font-size: 16px;
    font-weight: 700;
    fill: #e2e8f0;
  }

  .memory-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .memory-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .memory-label {
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
  }

  .memory-value {
    font-size: 0.9rem;
    font-weight: 600;
  }

  .trend-indicator {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: #21262d;
    color: #8b949e;
    font-weight: bold;
  }

  .trend-indicator.up {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  .trend-indicator.down {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .warning-text {
    font-size: 0.65rem;
    color: #8b949e;
    font-style: italic;
    text-align: center;
    padding: 0.5rem 0;
  }

  .sparkline-section {
    background: rgba(15, 23, 42, 0.4);
    padding: 0.75rem;
    border-radius: 8px;
  }

  .sparkline-label {
    font-size: 0.65rem;
    color: #64748b;
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.5rem;
  }

  .sparkline-large {
    height: 40px;
  }

  /* Network Stats */
  .network-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .network-stat-card {
    background: rgba(15, 23, 42, 0.4);
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }

  .network-stat-card.download {
    border-color: rgba(34, 197, 94, 0.2);
  }

  .network-stat-card.upload {
    border-color: rgba(239, 68, 68, 0.2);
  }

  .network-arrow {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    display: block;
  }

  .network-stat-card.download .network-arrow {
    color: #22c55e;
  }

  .network-stat-card.upload .network-arrow {
    color: #ef4444;
  }

  .network-stat-info {
    margin-bottom: 0.5rem;
  }

  .network-stat-label {
    font-size: 0.6rem;
    color: #64748b;
    text-transform: uppercase;
    display: block;
  }

  .network-stat-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f1f5f9;
  }

  .network-bar {
    height: 4px;
    background: #1e293b;
    border-radius: 2px;
    overflow: hidden;
  }

  .network-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .network-fill.in {
    background: linear-gradient(90deg, #22c55e, #4ade80);
  }

  .network-fill.out {
    background: linear-gradient(90deg, #ef4444, #f87171);
  }

  /* Request Section */
  .request-section {
    background: rgba(15, 23, 42, 0.4);
    border-radius: 8px;
    overflow: hidden;
  }

  .request-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  }

  .request-title {
    font-size: 0.65rem;
    color: #64748b;
    text-transform: uppercase;
  }

  .bandwidth-badge {
    background: #30363d;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    font-size: 0.6rem;
    color: #8b949e;
  }

  .network-list {
    max-height: 180px;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .network-list::-webkit-scrollbar {
    width: 4px;
  }

  .network-list::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 2px;
  }

  .network-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0;
    border-bottom: 1px solid rgba(99, 102, 241, 0.05);
    font-size: 0.65rem;
  }

  .network-item:last-child {
    border-bottom: none;
  }

  .request-type {
    min-width: 32px;
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    background: #30363d;
    color: #8b949e;
    text-align: center;
    font-size: 0.55rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .request-type.js {
    background: rgba(234, 179, 8, 0.2);
    color: #eab308;
  }

  .request-type.css {
    background: rgba(168, 85, 247, 0.2);
    color: #a855f7;
  }

  .request-type.img {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .request-type.xhr {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  .request-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #c9d1d9;
  }

  .request-size,
  .request-duration {
    color: #8b949e;
    min-width: 40px;
    text-align: right;
  }

  .empty-state {
    color: #8b949e;
    font-style: italic;
    text-align: center;
    padding: 1rem;
    font-size: 0.7rem;
  }

  /* Apps Chart */
  .apps-chart {
    background: rgba(15, 23, 42, 0.4);
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .chart-title {
    font-size: 0.65rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 0.75rem;
  }

  .bars-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 70px 1fr 35px;
    align-items: center;
    gap: 0.5rem;
  }

  .bar-label {
    font-size: 0.7rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track {
    height: 6px;
    background: #1e293b;
    border-radius: 3px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
    box-shadow: 0 0 8px currentColor;
  }

  .bar-value {
    font-size: 0.65rem;
    font-weight: 600;
    color: #94a3b8;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Z-Index Section */
  .zindex-section {
    margin-top: 0.5rem;
  }

  .section-label {
    display: block;
    font-size: 0.65rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .zindex-stack {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .zindex-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 6px;
    font-size: 0.7rem;
  }

  .zindex-item.top {
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  .zindex-rank {
    color: #8b949e;
    min-width: 24px;
  }

  .zindex-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #f0f6fc;
  }

  .zindex-value {
    color: #6366f1;
    font-weight: 600;
  }

  /* Plugin Grid */
  .plugin-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .plugin-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    background: rgba(15, 23, 42, 0.4);
    padding: 1rem 0.75rem;
    border-radius: 10px;
    border: 1px solid rgba(99, 102, 241, 0.15);
    transition: all 0.3s ease;
  }

  .plugin-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  }

  .plugin-card.native {
    border-color: rgba(99, 102, 241, 0.3);
  }

  .plugin-card.iframe {
    border-color: rgba(34, 197, 94, 0.3);
  }

  .plugin-card.federation {
    border-color: rgba(139, 92, 246, 0.3);
  }

  .plugin-card.wasm {
    border-color: rgba(245, 158, 11, 0.3);
  }

  .plugin-icon {
    font-size: 1.5rem;
  }

  .plugin-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .plugin-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .plugin-label {
    font-size: 0.6rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Total Plugins */
  .total-plugins {
    background: rgba(15, 23, 42, 0.4);
    padding: 1rem;
    border-radius: 10px;
    text-align: center;
  }

  .total-label {
    font-size: 0.65rem;
    color: #64748b;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  .total-value {
    font-size: 2rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.75rem;
  }

  .total-bar {
    display: flex;
    height: 8px;
    background: #1e293b;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .total-segment {
    height: 100%;
    transition: width 0.5s ease;
  }

  .total-segment.native {
    background: #6366f1;
  }

  .total-segment.iframe {
    background: #22c55e;
  }

  .total-segment.federation {
    background: #8b5cf6;
  }

  .total-segment.wasm {
    background: #f59e0b;
  }

  .total-legend {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .legend-item {
    font-size: 0.6rem;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .legend-item::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  .legend-item.native::before {
    background: #6366f1;
  }

  .legend-item.iframe::before {
    background: #22c55e;
  }

  .legend-item.federation::before {
    background: #8b5cf6;
  }

  .legend-item.wasm::before {
    background: #f59e0b;
  }

  /* Server Tab */
  .server-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem;
    text-align: center;
  }

  .server-error-icon {
    font-size: 2rem;
    opacity: 0.6;
  }

  .server-error-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #f59e0b;
  }

  .server-error-text {
    margin: 0;
    font-size: 0.75rem;
    color: #64748b;
  }

  .server-retry-btn,
  .server-refresh-btn {
    margin-top: 0.5rem;
    padding: 0.5rem 1.25rem;
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    color: #a5b4fc;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .server-retry-btn:hover,
  .server-refresh-btn:hover {
    background: rgba(99, 102, 241, 0.3);
  }

  .server-refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .server-refresh-btn {
    display: block;
    width: 100%;
    margin-top: 1rem;
  }

  .server-loading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    justify-content: center;
    padding: 2rem;
    color: #94a3b8;
    font-size: 0.8rem;
  }

  .server-status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 8px;
  }

  .server-status-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .server-status-label {
    font-size: 0.6rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .server-status-value {
    font-size: 1rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .server-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.6rem;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .server-status-badge.running {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  .status-dot-inline {
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
    box-shadow: 0 0 6px #22c55e;
  }

  .server-bar-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .server-bar-track {
    height: 8px;
    background: #1e293b;
    border-radius: 4px;
    overflow: hidden;
  }

  .server-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .server-bar-label {
    font-size: 0.7rem;
    color: #94a3b8;
  }

  .server-container-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .server-container-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(15, 23, 42, 0.4);
    border-radius: 6px;
    font-size: 0.7rem;
  }

  .server-container-name {
    font-weight: 600;
    color: #f1f5f9;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .server-container-image {
    flex: 1;
    color: #64748b;
    font-size: 0.6rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
  }

  .server-container-badge {
    padding: 0.15rem 0.5rem;
    border-radius: 8px;
    font-size: 0.55rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  .server-container-badge.running {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  .server-container-badge.stopped {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .server-ollama-section {
    margin-top: 1rem;
  }

  .server-ollama-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .server-model-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .server-model-chip {
    padding: 0.2rem 0.6rem;
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid rgba(139, 92, 246, 0.25);
    border-radius: 10px;
    font-size: 0.65rem;
    color: #c4b5fd;
    font-weight: 500;
  }

  /* Footer */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: rgba(15, 23, 42, 0.8);
    border-top: 1px solid rgba(99, 102, 241, 0.15);
    font-size: 0.6rem;
    color: #64748b;
  }

  .plugin-badge {
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #6366f1;
  }

  .refresh-info {
    opacity: 0.7;
  }
</style>
