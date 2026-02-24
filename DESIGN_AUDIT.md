

Here is the complete design audit document, unabridged.

---

# PREMIUM DESIGN AUDIT: rdtect OS

**Auditor**: Designer Agent (Opus)
**Date**: 2026-02-25
**Scope**: Full shell (11 components) + 8 plugins, 15 dimensions, Jobs Filter applied

---

## Executive Summary

rdtect OS has exceptional visual ambition -- the glass morphism, layered backgrounds, and window animations rival commercial desktop environments. But it suffers from **design incoherence**: each plugin exists in its own visual universe, the background is overloaded with decorative noise, the boot screen serves the developer's ego rather than the user's needs, and accessibility is systematically ignored. The system has roughly 40 independent animations but no formal type scale, no spacing system, and no shared component library across plugins.

The core insight: **this is a showcase that impresses in screenshots but fatigues in use**.

---

## PHASE 1: CRITICAL (Ship-blocking issues)

### 1. Boot Screen: Self-Promotion Over User Respect

**Files**: `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte:656-770`

The boot screen is a 3.5-second forced wait with social links, tech badges, and branding. This is the single most damaging UX decision in the entire application. A real OS boots as fast as it can. This one forces users to watch an ad.

**Jobs Filter**: Can this be removed? YES. The desktop loads fine without it. Does the boot screen serve the user? NO. It serves the developer. Would a user need to be told it exists? No, they cannot avoid it.

| Issue | Location | Current Value | Fix |
|-------|----------|---------------|-----|
| Forced 3.5s wait | `Desktop.svelte:55-61` | `setTimeout(() => { isFadingOut = true; ... }, 3500)` | Change `3500` to `800`. Or remove boot screen entirely |
| Social links on boot screen | `Desktop.svelte:717-730` | Three `<a>` tags: GitHub, X, Website with `px-3 py-1.5 rounded-full bg-slate-700/50` | Delete the entire `<div class="flex items-center justify-center gap-3 mb-6">` block (lines 717-730) |
| Tech stack badges | `Desktop.svelte:733-738` | Four `<span>` badges: "Svelte 5", "TypeScript", "Bun", "5 Plugin Types" with `px-3 py-1 bg-desktop-accent/10 rounded-full text-indigo-200 text-xs border border-desktop-accent/20` | Delete the entire `<div class="flex gap-2 justify-center mb-6 flex-wrap">` block (lines 733-738) |
| Author info | `Desktop.svelte:708-714` | `<p class="text-slate-400 text-sm mb-2">A portfolio project by</p>` and `<span class="text-desktop-accent font-semibold text-lg">rdtect</span>` | Delete the entire `<div class="transition-all duration-500 ...">` block (lines 707-739) |
| Version number | `Desktop.svelte:702` | `<p class="text-slate-600 text-[10px] mt-1 font-mono">v1.0.0</p>` | Delete this line |
| Profile fade-in delay | `Desktop.svelte:49-52` | `const profileTimeout = setTimeout(() => { showProfile = true; }, 800)` | Remove this timeout and the `showProfile` state variable (line 24) |
| Boot message cycling | `Desktop.svelte:45-47` | `setInterval(() => { bootMessageIndex = ... }, 600)` | Keep but accelerate: change `600` to `200` |
| Progress bar increment rate | `Desktop.svelte:40-42` | `setInterval(() => { loadingProgress = Math.min(loadingProgress + Math.random() * 8 + 3, 100); }, 150)` | Change to `Math.random() * 20 + 10` and interval to `80` for faster fill |
| Shimmer overlay on boot panel | `Desktop.svelte:666` | `<div class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none">` | Delete this div |
| Orbiting dots on logo | `Desktop.svelte:676-687` | Three nested `<div>` elements with `animate-spin-slow`, `animate-spin-reverse`, `animate-spin-slower` containing 6 colored dots | Delete all three orbit container divs (lines 676-687). Keep only the logo monogram div (lines 690-692) |
| Pulsing glow behind logo | `Desktop.svelte:673` | `<div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-desktop-accent/30 to-purple-500/30 animate-pulse-glow blur-xl">` | Delete this div |
| Logo pulse animation | `Desktop.svelte:690` | `animate-logo-pulse` class on logo monogram | Remove `animate-logo-pulse` class. Change to static: `shadow-[0_0_20px_rgba(99,102,241,0.4)]` |
| Text glow animation | `Desktop.svelte:697` | `animate-text-glow` class on h1 | Remove `animate-text-glow` class |

**Recommended simplified boot screen** (replace lines 656-770):

```svelte
{#if isLoading}
  <div
    class="absolute inset-0 flex items-center justify-center z-50 transition-opacity duration-500"
    class:opacity-0={isFadingOut}
    class:pointer-events-none={isFadingOut}
  >
    <div class="text-center p-8 glass-panel rounded-2xl max-w-sm mx-4">
      <!-- Logo -->
      <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-desktop-accent to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
        <span class="text-2xl font-black text-white tracking-tighter">rd</span>
      </div>
      <h1 class="text-2xl font-bold mb-1">
        <span class="text-desktop-accent">rdtect</span>
        <span class="text-slate-300 font-light ml-1">OS</span>
      </h1>
      <!-- Progress -->
      <div class="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-4 mb-2">
        <div
          class="h-full bg-desktop-accent rounded-full transition-all duration-100"
          style="width: {loadingProgress}%"
        ></div>
      </div>
      <p class="text-slate-500 text-xs font-mono">{bootMessages[bootMessageIndex]}</p>
    </div>
  </div>
{/if}
```

---

### 2. Background Visual Noise: 8 Layers of Distraction

**Files**: `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte:552-619`, `/home/rdtect/Projects/personal/desktop-os/src/app.css:117-596`

The desktop background currently renders **8 simultaneous animated layers**:

| Layer | File:Line | CSS Class / Element | Animation | Duration |
|-------|-----------|---------------------|-----------|----------|
| 1. Gradient | `app.css:117-129` | `.bg-desktop-gradient` | `gradient-shift` | 20s infinite |
| 2. Aurora ::before | `app.css:564-568` | `.bg-desktop-aurora::before` | `aurora-move-1` | 15s infinite |
| 3. Aurora ::after | `app.css:571-576` | `.bg-desktop-aurora::after` | `aurora-move-2` | 18s infinite |
| 4. Radial overlay | `app.css:131-137` | `.bg-desktop-overlay` | none (static) | -- |
| 5. Grid pattern | `app.css:139-144` | `.bg-desktop-grid` | none (static) | -- |
| 6. Noise texture | `app.css:147-151` | `.bg-desktop-noise` | none (static, 0.03 opacity) | -- |
| 7. SVG watermarks + shapes | `Desktop.svelte:563-603` | 5 inline SVGs | `float-slow` (12s), `float-drift` (15s), `float-reverse` (10s), `spin-very-slow` (30s), `float` (3s) | various |
| 8. Particle dots | `Desktop.svelte:612-618`, `app.css:499-561` | `.particle-1` through `.particle-5` | `particle-float` | 18-28s infinite |

Plus a giant 180px "rdtect" text watermark at 1.5% opacity at `Desktop.svelte:605-609`:
```svelte
<div class="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-[0.015] select-none">
  <span class="text-[180px] font-black tracking-tighter text-white whitespace-nowrap">rdtect</span>
</div>
```

**Jobs Filter -- How many layers can be removed before it breaks?**

| Layer | Keep/Remove | Reason |
|-------|-------------|--------|
| 1. Gradient | KEEP | Base visual identity, the only layer that defines the wallpaper character |
| 2-3. Aurora | KEEP (reduce opacity) | Adds living depth. Reduce `rgba(99, 102, 241, 0.18)` to `0.10` and `rgba(139, 92, 246, 0.12)` to `0.06` |
| 4. Overlay | REMOVE | Redundant with aurora; 4 overlapping radial-gradients that do essentially the same thing |
| 5. Grid | REMOVE | Subtle 40px grid at 1.5% white opacity. Adds visual noise, no functional purpose |
| 6. Noise texture | REMOVE | SVG noise texture at 3% opacity. Imperceptible to users; wastes GPU compositing |
| 7. SVG watermarks | REMOVE | 5 SVG elements (monogram, circles, triangle, diamond, rotated square) all animating. Self-branding on desktop wallpaper is narcissistic |
| 8. Particles | REMOVE | 5 dots that are individually imperceptible (3-4px at 30% opacity). Collectively they add subtle movement but the aurora already provides that |
| Text watermark | REMOVE | 180px "rdtect" at 1.5% opacity is subliminal self-branding |

**Fix in Desktop.svelte** -- Replace lines 552-619 with:

```svelte
<!-- Desktop Background: gradient + aurora only -->
<div class="absolute inset-0 bg-desktop-gradient">
  <div class="bg-desktop-aurora"></div>
</div>
```

**Fix in app.css** -- Remove these class definitions entirely:

| Lines to Remove | Class | Reason |
|----------------|-------|--------|
| `app.css:131-137` | `.bg-desktop-overlay` | Removed from markup |
| `app.css:139-144` | `.bg-desktop-grid` | Removed from markup |
| `app.css:147-151` | `.bg-desktop-noise` | Removed from markup |
| `app.css:192-200` | `.bg-icon-gradient`, `.bg-titlebar-gradient`, `.bg-preview-gradient` | Only `.bg-preview-gradient` is used; keep it, remove others |
| `app.css:450-596` | All wallpaper branding effects: `.animate-float-slow`, `.animate-float-drift`, `.animate-float-reverse`, `.animate-spin-very-slow`, `.particles-container`, `.particle`, `.particle-1` through `.particle-5`, `@keyframes particle-float`, enhanced aurora overrides, `.aurora-third`, `@keyframes aurora-move-3` | All decoration removed from markup |

**Reduce aurora opacity in app.css** (lines 564-576):

Old:
```css
.bg-desktop-aurora::before {
  background:
    radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.18) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.12) 0%, transparent 40%);
  animation: aurora-move-1 15s ease-in-out infinite;
}

.bg-desktop-aurora::after {
  background:
    radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 20% 70%, rgba(168, 85, 247, 0.08) 0%, transparent 40%);
  animation: aurora-move-2 18s ease-in-out infinite;
}
```

New:
```css
.bg-desktop-aurora::before {
  background:
    radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.10) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.06) 0%, transparent 40%);
  animation: aurora-move-1 15s ease-in-out infinite;
}

.bg-desktop-aurora::after {
  background:
    radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 20% 70%, rgba(168, 85, 247, 0.04) 0%, transparent 40%);
  animation: aurora-move-2 18s ease-in-out infinite;
}
```

---

### 3. Plugin Color Chaos: No Shared Design System

Every plugin invents its own color scheme. This destroys the illusion of a unified operating system.

| Plugin | File | Background | Accent | Font | Matches desktop-os tokens? |
|--------|------|-----------|--------|------|---------------------------|
| Calculator | `plugins/calculator/src/Calculator.svelte` | `linear-gradient(135deg, #334155, #1e293b)` (line ~CSS) | `#6366f1` (indigo) buttons | system-ui | Partially -- uses slate range but hardcoded |
| Terminal | `plugins/terminal/src/Terminal.svelte` | `#0d1117` (GitHub Dark, line ~CSS `.terminal`) | `#33ff33` (green prompt), `#58a6ff` (blue commands), `#f85149` (red errors) | monospace `14px` | NO -- entirely different palette |
| File Browser | `plugins/file-browser/src/FileBrowser.svelte` | `bg-desktop-bg` (Tailwind class) | Indigo via Tailwind | system | YES |
| AI Chat | `plugins/ai-chat/src/AIChat.svelte` | Tailwind slate classes | `#6366f1` via `bg-indigo-500` gradient | system | YES |
| Welcome | `plugins/welcome/src/Welcome.svelte` | Tailwind slate + particle canvas | Indigo gradient buttons | system | YES |
| About Me | `plugins/about-me/src/AboutMe.svelte` | Tailwind slate classes | Indigo gradient accent | system | YES |
| Notes | `plugins/notes/src/Notes.svelte` | Shadow DOM: `#0f172a` bg (matches) | `#fbbf24` (amber/yellow) for pin icon, new note button, active indicators | system | NO -- amber accent clashes with indigo system accent |
| Code Editor | `plugins/code-editor/src/CodeEditor.svelte` | `#1e1e1e` (VS Code dark, line ~326) | `#0e639c` (VS Code blue), `#252526` (toolbar), `#1e1e1e` (editor bg) | `Consolas, monospace 14px` | NO -- entire VS Code color scheme imported verbatim |

**Three plugins are visual aliens**: Terminal, Notes, and Code Editor. They feel like they were imported from different applications without adaptation.

**Fix -- Terminal** (`/home/rdtect/Projects/personal/desktop-os/plugins/terminal/src/Terminal.svelte`):

In the `<style>` block, find the `.terminal` class:

Old:
```css
.terminal {
  background: #0d1117;
  /* ... */
}
```
New:
```css
.terminal {
  background: #0f172a;
  /* ... */
}
```

Old prompt color:
```css
.prompt { color: #33ff33; }
```
New:
```css
.prompt { color: #4ec9b0; }
```

Old command output color:
```css
/* command type */ color: #58a6ff;
```
New:
```css
/* command type */ color: #818cf8;
```

Old error color:
```css
/* error type */ color: #f85149;
```
New:
```css
/* error type */ color: #f87171;
```

Old system message color:
```css
/* system type */ color: #8b949e;
```
New:
```css
/* system type */ color: #94a3b8;
```

**Fix -- Code Editor** (`/home/rdtect/Projects/personal/desktop-os/plugins/code-editor/src/CodeEditor.svelte`):

Old (`.code-editor` background, approximately line 326):
```css
.code-editor { background: #1e1e1e; }
```
New:
```css
.code-editor { background: #0f172a; }
```

Old (toolbar background):
```css
.toolbar { background: #252526; }
```
New:
```css
.toolbar { background: #1e293b; }
```

Old (run button, approximately line 394-416):
```css
.run-btn { background-color: #0e639c; }
.run-btn:hover { background-color: #1177bb; }
```
New:
```css
.run-btn { background-color: #6366f1; }
.run-btn:hover { background-color: #818cf8; }
```

Old (tab bar background):
```css
.tab-bar { background: #252526; border-bottom: 1px solid #1e1e1e; }
```
New:
```css
.tab-bar { background: #1e293b; border-bottom: 1px solid #334155; }
```

Old (tab active background):
```css
.tab.active { background: #1e1e1e; border-bottom-color: transparent; }
```
New:
```css
.tab.active { background: #0f172a; border-bottom-color: transparent; }
```

Old (tab inactive text):
```css
.tab { color: #969696; }
```
New:
```css
.tab { color: #94a3b8; }
```

Old (status bar):
```css
.status-bar { background: #007acc; }
```
New:
```css
.status-bar { background: #6366f1; }
```

**Fix -- Notes** (`/home/rdtect/Projects/personal/desktop-os/plugins/notes/src/Notes.svelte`):

Inside the Shadow DOM CSS (defined in the `connectedCallback` or `<style>` within the custom element), find all amber/yellow accent references:

Old:
```css
/* Pin icon, new note button, active note indicator */
color: #fbbf24;
background: #fbbf24;
border-color: #fbbf24;
```
New:
```css
color: #6366f1;
background: #6366f1;
border-color: #6366f1;
```

Old (hover state if present):
```css
background: #f59e0b;
```
New:
```css
background: #818cf8;
```

Old (WebComponent badge at bottom, if it says "WebComponent Plugin"):
Keep as-is -- this badge serves the portfolio purpose of demonstrating plugin types.

---

### 4. Accessibility: Systematically Ignored

**a11y suppression comments found**:

| File | Line | Suppression |
|------|------|-------------|
| `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | 549 | `<!-- svelte-ignore a11y_no_static_element_interactions -->` |
| `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte` | 262 | `<!-- svelte-ignore a11y_click_events_have_key_events -->` |
| `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte` | 263 | `<!-- svelte-ignore a11y_no_static_element_interactions -->` |
| `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte` | 280 | `<!-- svelte-ignore a11y_no_static_element_interactions -->` |
| `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Taskbar.svelte` | 280 | `<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->` |
| `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte` | 313 | `<!-- svelte-ignore a11y_no_static_element_interactions -->` |
| `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte` | 625 | `<!-- svelte-ignore a11y_click_events_have_key_events -->` |
| `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte` | 626 | `<!-- svelte-ignore a11y_no_static_element_interactions -->` |

**Critical accessibility issues with exact fixes**:

**4a. Traffic light buttons have insufficient aria-labels**

File: `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte:291-324`

Old (close button, line 291-298):
```svelte
<button
  class="traffic-light traffic-light-close group"
  onclick={handleClose}
  title="Close"
>
```
New:
```svelte
<button
  class="traffic-light traffic-light-close group"
  onclick={handleClose}
  title="Close"
  aria-label="Close window"
>
```

Old (minimize button, line 300-307):
```svelte
<button
  class="traffic-light traffic-light-minimize group"
  onclick={handleMinimize}
  title="Minimize"
>
```
New:
```svelte
<button
  class="traffic-light traffic-light-minimize group"
  onclick={handleMinimize}
  title="Minimize"
  aria-label="Minimize window"
>
```

Old (maximize button, line 309-313):
```svelte
<button
  class="traffic-light traffic-light-maximize group"
  onclick={handleMaximize}
  title={win.isMaximized ? 'Restore' : 'Maximize'}
>
```
New:
```svelte
<button
  class="traffic-light traffic-light-maximize group"
  onclick={handleMaximize}
  title={win.isMaximized ? 'Restore' : 'Maximize'}
  aria-label={win.isMaximized ? 'Restore window' : 'Maximize window'}
>
```

**4b. Traffic light touch targets are 12px (minimum is 44px)**

File: `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte:521-533`

Old:
```css
.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  transform-origin: center;
}
```
New:
```css
.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  transform-origin: center;
  /* Increase touch target to 44px while keeping visual size at 12px */
  padding: 16px;
  margin: -16px;
  background-clip: content-box;
}
```

Note: The `background-clip: content-box` ensures the colored gradient backgrounds only fill the 12px visual circle, not the 44px hit area. The negative margins compensate for the padding to prevent layout shift. This may require adjusting the `.traffic-lights` container gap from `8px` to `40px` to account for the negative margins, or using a different approach like `::after` pseudo-elements for hit areas:

Alternative approach (cleaner):
```css
.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  transform-origin: center;
}

.traffic-light::after {
  content: '';
  position: absolute;
  inset: -16px;
  border-radius: 50%;
}
```

**4c. Desktop icons have no keyboard navigation**

File: `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopIcons.svelte`

The icon container divs are click-only. Each icon `<div>` needs:

Old (approximately in the `{#each}` block rendering icons):
```svelte
<div
  class="icon absolute cursor-pointer ..."
  ondblclick={() => wm.openWindow(app.id)}
  oncontextmenu={(e) => onContextMenu?.(e, app)}
>
```
New:
```svelte
<div
  class="icon absolute cursor-pointer ..."
  role="button"
  tabindex="0"
  aria-label="Open {app.title}"
  ondblclick={() => wm.openWindow(app.id)}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wm.openWindow(app.id); } }}
  oncontextmenu={(e) => onContextMenu?.(e, app)}
>
```

**4d. No `prefers-reduced-motion` support anywhere**

File: `/home/rdtect/Projects/personal/desktop-os/src/app.css`

All 37+ `@keyframes` animations and all component-scoped animations run regardless of user preference. This is a WCAG 2.1 Level AAA violation (and arguably Level AA under criterion 2.3.3).

Add at the END of `app.css` (after line 630):

```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**4e. Taskbar icons have no focus-visible styles**

File: `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Taskbar.svelte:334-341`

Old:
```svelte
<button
  class="taskbar-icon relative w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200
    {hasFocusedWindow ? 'taskbar-icon-focused' : ''}
    {isRunning ? 'taskbar-icon-running' : ''}"
```
New:
```svelte
<button
  class="taskbar-icon relative w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200
    focus-visible:ring-2 focus-visible:ring-desktop-accent focus-visible:ring-offset-1 focus-visible:ring-offset-desktop-bg
    {hasFocusedWindow ? 'taskbar-icon-focused' : ''}
    {isRunning ? 'taskbar-icon-running' : ''}"
```

Also add to Start button at `Taskbar.svelte:242`:

Old:
```svelte
<button
  class="start-button group relative w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200"
```
New:
```svelte
<button
  class="start-button group relative w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200
    focus-visible:ring-2 focus-visible:ring-desktop-accent focus-visible:ring-offset-1 focus-visible:ring-offset-desktop-bg"
```

**4f. Calendar days have no accessible labels**

File: `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte:674-685`

Old:
```svelte
<button
  class="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all duration-150
    {isToday
      ? 'bg-desktop-accent text-white font-bold shadow-lg shadow-desktop-accent/30'
      : isCurrentMonth
        ? 'text-slate-300 hover:bg-slate-700/50'
        : 'text-slate-600'
    }"
>
  {day}
</button>
```
New:
```svelte
<button
  aria-label="{monthNames[currentMonth]} {day}, {currentYear}{isToday ? ' (today)' : ''}"
  class="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all duration-150
    {isToday
      ? 'bg-desktop-accent text-white font-bold shadow-lg shadow-desktop-accent/30'
      : isCurrentMonth
        ? 'text-slate-300 hover:bg-slate-700/50'
        : 'text-slate-600'
    }"
>
  {day}
</button>
```

**4g. Color contrast failures**

| Element | File:Line | Foreground | Background | Ratio | Pass? |
|---------|-----------|-----------|-----------|-------|-------|
| Boot version | `Desktop.svelte:702` | `#475569` (slate-600 via `text-slate-600`) | `#0f172a` (desktop-bg) | ~2.8:1 | FAIL AA (needs 4.5:1) |
| Boot "Web-Native Desktop Experience" | `Desktop.svelte:701` | `#94a3b8` (slate-400 via `text-slate-400`) | glass-panel bg | ~5.7:1 | PASS AA |
| Clock date | `Taskbar.svelte:393` | `#94a3b8` (slate-400 via `text-slate-400`) | taskbar glass bg | ~5.2:1 | PASS AA |
| Calendar non-current-month days | `DesktopWidgets.svelte:681` | `#475569` (slate-600) | glass-panel bg `rgba(15,23,42,0.85)` | ~2.8:1 | FAIL AA |
| Context menu shortcuts | Various | `text-slate-500` | context menu bg | ~3.6:1 | FAIL AA |

Fix for failing elements: Change `text-slate-600` to `text-slate-400` (minimum) or `text-slate-300` for better readability:

`Desktop.svelte:702`: Change `text-slate-600` to `text-slate-400`
`DesktopWidgets.svelte:681`: Change `text-slate-600` to `text-slate-500` (would reach ~3.6:1, still marginal; `text-slate-400` at ~5.7:1 is safer)

---

### 5. Duplicate Window Animation Definitions

Window animations are defined in **THREE places** with **DIFFERENT values**:

| Animation | `app.css` value | `app.css` line | `Window.svelte` value | `Window.svelte` line | Match? |
|-----------|----------------|----------------|----------------------|---------------------|--------|
| window-open start | `scale(0.85) translateY(10px)` | 25-26 | `scale(0.92) translateY(8px)` | 728-729 | NO |
| window-open timing | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 96 | `cubic-bezier(0.16, 1, 0.3, 1)` | 778 | NO |
| window-close end | `scale(0.9) translateY(10px)` | 234 | `scale(0.92) translateY(8px)` | 743-744 | NO |
| window-close timing | `cubic-bezier(0.4, 0, 1, 1)` | 239 | `cubic-bezier(0.4, 0, 1, 1)` | 781 | YES |
| window-minimize end | `scale(0.3) translateY(80vh)` | 48 | `scale(0.5) translateY(100px)` | 755 | NO |
| window-maximize | includes `transform: scale(1.005)` at 50% | 57-58 | no scale, just border-radius | 763-766 | NO |
| window-restore | includes `transform: scale(0.995)` at 50% | 70-71 | no scale, just border-radius | 769-774 | NO |

The scoped `<style>` in `Window.svelte` takes precedence because Svelte scopes its styles to the component. The `app.css` definitions are effectively **dead code** that creates confusion.

**Fix**: Remove all window animation `@keyframes` and `.animate-window-*` classes from `/home/rdtect/Projects/personal/desktop-os/src/app.css`.

Lines to delete from `app.css`:
- Lines 23-37: `@keyframes window-open`
- Lines 39-49: `@keyframes window-minimize`
- Lines 51-63: `@keyframes window-maximize`
- Lines 65-77: `@keyframes window-restore`
- Lines 90-114: `.animate-float`, `.animate-window-open`, `.animate-window-minimize`, `.animate-window-maximize`, `.animate-window-restore`, `.animate-preview-in`
- Lines 227-241: `@keyframes window-close` and `.animate-window-close`

Keep only the definitions in `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte:726-795` (the scoped versions). These are the ones actually used.

Also keep `@keyframes preview-in` (lines 79-88) and `.animate-preview-in` (lines 112-114) in `app.css` since those are used by `Taskbar.svelte` and not redefined elsewhere.

---

## PHASE 2: REFINEMENT (Quality issues)

### 6. Typography: No Type Scale

Font sizes found across the codebase with no systematic relationship:

| Size | Tailwind Class / CSS | Where Used | File:Line Examples |
|------|---------------------|-----------|-------------------|
| 9px | `text-[9px]` | Plugin type badges in taskbar tooltips | `Taskbar.svelte:272`, `Taskbar.svelte:324` |
| 10px | `text-[10px]` | Boot version, battery %, taskbar date, progress % | `Desktop.svelte:702,767`, `Taskbar.svelte:393`, `DesktopWidgets.svelte:462` |
| 11px | `text-[11px]` | Clock time, icon labels, preview window titles, tab names | `Taskbar.svelte:392`, `DesktopIcons.svelte` (label), `Taskbar.svelte:299` |
| 12px | `text-xs` | Boot messages, calendar day names, toggle labels, social link text, quick settings labels | `Desktop.svelte:761`, `DesktopWidgets.svelte:503,514,525,666`, `Desktop.svelte:718-729` |
| 13px | `text-[13px]` | Window title bar text, context menu items | `Window.svelte:330` |
| 14px | `text-sm` | App titles in previews, menu items, search inputs, slider labels | `Taskbar.svelte:271,323`, `StartMenu.svelte`, `DesktopWidgets.svelte:539,558,591` |
| 14px | CSS `font-size: 14px` | Terminal font, Code Editor font | `Terminal.svelte` (style), `CodeEditor.svelte` (style) |
| 16px | `text-base` | Rarely explicitly used | -- |
| 18px | `text-lg` | Preview app icon label, search input, "rdtect" brand in boot | `Taskbar.svelte:270`, `AppLauncher.svelte` search, `Desktop.svelte:711` |
| 20px | `text-xl` | Section headers (rare) | -- |
| 24px | `text-2xl` | Taskbar emoji icons | `Taskbar.svelte:343` |
| 30px | `text-3xl` | Boot logo "rd", preview app placeholder icon | `Desktop.svelte:691`, `Taskbar.svelte:289` |
| 36px | `text-4xl` | Boot "rdtect" title | `Desktop.svelte:697` |
| 40px | CSS `font-size: 2.5rem` | Calculator display result | `Calculator.svelte` (style) |
| 180px | `text-[180px]` | Background "rdtect" watermark | `Desktop.svelte:606` |

That is **16 distinct font sizes** with no scale relationship.

**Fix**: Add a formal type scale to `/home/rdtect/Projects/personal/desktop-os/tailwind.config.js`:

Old (lines 4-14):
```js
theme: {
  extend: {
    colors: {
      desktop: {
        bg: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        accent: '#6366f1'
      }
    }
  }
},
```

New:
```js
theme: {
  extend: {
    colors: {
      desktop: {
        bg: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        accent: '#6366f1',
        'accent-hover': '#818cf8',
        muted: '#94a3b8',
        subtle: '#64748b',
      }
    },
    fontSize: {
      'desktop-xs': ['11px', { lineHeight: '16px' }],
      'desktop-sm': ['13px', { lineHeight: '20px' }],
      'desktop-base': ['14px', { lineHeight: '22px' }],
      'desktop-lg': ['16px', { lineHeight: '24px' }],
      'desktop-xl': ['20px', { lineHeight: '28px' }],
      'desktop-2xl': ['28px', { lineHeight: '36px' }],
    },
    borderRadius: {
      'desktop-sm': '8px',
      'desktop-md': '12px',
      'desktop-lg': '16px',
      'desktop-xl': '24px',
    },
  }
},
```

Then migrate sizes:
- `text-[9px]` --> `text-desktop-xs` (round up to 11px; 9px is too small to read)
- `text-[10px]` --> `text-desktop-xs`
- `text-[11px]` --> `text-desktop-xs`
- `text-xs` (12px) --> `text-desktop-xs` (11px) or `text-desktop-sm` (13px) depending on context
- `text-[13px]` --> `text-desktop-sm`
- `text-sm` (14px) --> `text-desktop-base`
- `text-base` (16px) --> `text-desktop-lg`

---

### 7. Spacing: No Consistent Rhythm

Padding and gap values used across the codebase with no systematic scale:

| Value | Tailwind | px | Occurrences | Context |
|-------|---------|-----|-------------|---------|
| `gap-0.5` | 2px | 2 | Taskbar icon gaps | Too tight, should be 4px minimum |
| `gap-1` | 4px | 4 | Battery/tray items, system tray | |
| `p-1.5` | 6px | 6 | Taskbar internal padding | Fractional, not on a 4px grid |
| `py-1.5` | 6px | 6 | Social link buttons, badge pills | Fractional |
| `gap-2` | 8px | 8 | Most common gap value | Good base |
| `gap-3` | 12px | 12 | Quick settings items, social links | |
| `p-2` | 8px | 8 | Preview thumbnails | |
| `p-3` | 12px | 12 | Quick toggle buttons, tray panel | |
| `p-4` | 16px | 16 | Calendar popup, quick settings panel | |
| `p-8` | 32px | 32 | Simplified boot panel (proposed) | |
| `p-10` | 40px | 40 | Current boot panel | Excessive; 40px padding on a loading dialog |
| `px-3 py-1.5` | 12px/6px | -- | Social link pill buttons | Mixed, fractional |
| `px-3 py-2` | 12px/8px | -- | System tray panel, preview header | |
| `px-12` | 48px | 48 | Calculator button horizontal padding | Extreme for a button |
| `mb-6` | 24px | 24 | Boot content section margins | |
| `mb-4` | 16px | 16 | Various sections | |
| `mb-3` | 12px | 12 | Volume slider content | |
| `mb-2` | 8px | 8 | Section sub-titles | |
| `mt-2` | 8px | 8 | Progress percentage below bar | |

**Fix**: Adopt a strict 4px-based spacing scale. Allowed values: 4, 8, 12, 16, 24, 32, 48.

Specific fixes:
- `gap-0.5` (2px) at `Taskbar.svelte:255` --> change to `gap-1` (4px)
- `py-1.5` (6px) everywhere --> change to `py-2` (8px)
- `p-10` (40px) at `Desktop.svelte:664` --> change to `p-8` (32px)
- `px-12` in Calculator --> change to `px-8` (32px)

---

### 8. Duplicate Context Menu Implementations

File Browser has its own context menu at `/home/rdtect/Projects/personal/desktop-os/plugins/file-browser/src/FileBrowser.svelte`, while the shell provides `ContextMenu.svelte` at `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/ContextMenu.svelte`.

Evidence: File Browser defines its own context menu rendering in its template with its own positioning logic, its own animation, and its own styling. This means:

1. Two different visual styles for the same interaction pattern
2. Two codebases to maintain
3. Users see inconsistent context menus depending on where they right-click
4. The File Browser context menu does not get the shell's staggered item animation (`0.025s` per item delay) or the hover indicator bar (3px wide gradient line)

**Fix**: Expose `ContextMenu` from the shell as a shared service. Two approaches:

**Approach A** (event bus -- recommended): Plugin emits a `contextmenu:show` event via the event bus with `{ x, y, items }`. Desktop.svelte listens and renders the shell ContextMenu.

**Approach B** (props -- simpler): Pass a `showContextMenu` callback from Window.svelte to the plugin component. The plugin calls it with items; the shell renders the menu.

Window.svelte already receives `onContextMenu` as a prop (line 27-28) and passes it through. The File Browser just needs to use it instead of rendering its own.

---

### 9. Motion: Quantity Over Quality

Total `@keyframes` definitions counted:

**In `/home/rdtect/Projects/personal/desktop-os/src/app.css`**: 37 animations
- `float` (line 18)
- `window-open` (line 24) -- DUPLICATE
- `window-minimize` (line 40) -- DUPLICATE
- `window-maximize` (line 52) -- DUPLICATE
- `window-restore` (line 66) -- DUPLICATE
- `preview-in` (line 79)
- `gradient-shift` (line 123)
- `aurora-move-1` (line 180)
- `aurora-move-2` (line 187)
- `window-close` (line 227) -- DUPLICATE
- `pulse-glow` (line 274)
- `breathe` (line 284)
- `launcher-fade-in` (line 294)
- `launcher-slide-down` (line 303)
- `launcher-slide-up` (line 314)
- `shimmer` (line 346)
- `progress-shimmer` (line 356)
- `spin-slow` (line 366)
- `spin-reverse` (line 377)
- `spin-slower` (line 387)
- `logo-pulse` (line 396)
- `pulse-glow-bg` (line 412)
- `text-glow` (line 428)
- `float-slow` (line 452)
- `float-drift` (line 461)
- `float-reverse` (line 473)
- `spin-very-slow` (line 486)
- `particle-float` (line 544)
- `aurora-move-3` (line 592)
- `snap-preview-in` (line 601)
- `snap-preview-pulse` (line 612)

**In component `<style>` blocks**: 8 additional animations
- `Window.svelte`: `window-open`, `window-close`, `window-minimize`, `window-maximize`, `window-restore` (5)
- `Taskbar.svelte`: `taskbar-appear`, `preview-appear`, `tooltip-appear` (3)
- `DesktopWidgets.svelte`: `slide-down` (1)

**Redundancy analysis**:

| Redundancy Group | Animations | Recommendation |
|-----------------|-----------|----------------|
| 4 spin variants | `spin-slow` (4s), `spin-reverse` (6s), `spin-slower` (8s), `spin-very-slow` (30s) | After removing background decorations, only `spin-slow` and `spin-reverse` are used (boot screen orbits). After simplifying boot screen, NONE are used. Remove all 4. |
| 4 float variants | `float` (3s), `float-slow` (12s), `float-drift` (15s), `float-reverse` (10s) | Only used by background decorations being removed. Remove all 4. |
| 2 shimmer variants | `shimmer` (line 346), `progress-shimmer` (line 356) | After simplifying boot screen, neither is used. Remove both. |
| 2 pulse-glow definitions | `pulse-glow` (line 274, notification dot), `pulse-glow-bg` (line 412, logo bg) | After simplifying boot screen, only `pulse-glow` is used (notification dot). Remove `pulse-glow-bg`. |
| 5 duplicate window animations | In both `app.css` and `Window.svelte` | Remove from `app.css`, keep in `Window.svelte` (covered in Finding 5). |
| `breathe` animation | `app.css:284` | Not used anywhere in any component. Remove. |
| `logo-pulse` animation | `app.css:396` | Only used in boot screen orbits (being removed). Remove. |
| `text-glow` animation | `app.css:428` | Only used on boot screen title (being removed). Remove. |

**After all Phase 1 removals, the surviving animations are**:

| Animation | Location | Purpose | Keep? |
|-----------|---------|---------|-------|
| `gradient-shift` | `app.css:123` | Background gradient movement | YES |
| `aurora-move-1` | `app.css:180` | Aurora glow movement | YES |
| `aurora-move-2` | `app.css:187` | Aurora glow movement | YES |
| `preview-in` | `app.css:79` | Taskbar preview popup entrance | YES |
| `pulse-glow` | `app.css:274` | Notification dot pulse | YES |
| `launcher-fade-in` | `app.css:294` | App launcher overlay fade | YES |
| `launcher-slide-down` | `app.css:303` | App launcher search slide | YES |
| `launcher-slide-up` | `app.css:314` | App launcher grid slide | YES |
| `snap-preview-in` | `app.css:601` | Window snap zone preview | YES |
| `snap-preview-pulse` | `app.css:612` | Window snap zone pulse | YES |
| `window-open/close/min/max/restore` | `Window.svelte` scoped | Window lifecycle animations | YES |
| `taskbar-appear` | `Taskbar.svelte` scoped | Taskbar entrance | YES |
| `preview-appear` | `Taskbar.svelte` scoped | Preview popup entrance | YES |
| `tooltip-appear` | `Taskbar.svelte` scoped | Tooltip entrance | YES |
| `slide-down` | `DesktopWidgets.svelte` scoped | Quick settings popup entrance | YES |

That reduces from **45 total animations** to **15** -- a 67% reduction.

---

### 10. Empty States: Inconsistent Quality

| Component | Has Empty State? | File | Description | Quality |
|-----------|-----------------|------|-------------|---------|
| AI Chat | YES | `plugins/ai-chat/src/AIChat.svelte` | Chat bubble icon + "Start a conversation" + "Ask anything..." prompt | GOOD -- clear CTA, visual icon, inviting language |
| File Browser | YES | `plugins/file-browser/src/FileBrowser.svelte` | Folder icon + "This folder is empty" | OK -- functional but no suggested action |
| Notes | YES | `plugins/notes/src/Notes.svelte` | "No notes yet. Click + to create one" | POOR -- text only, no icon, references a button the user may not see |
| Code Editor | N/A | -- | Always has default file content | N/A |
| Terminal | N/A | -- | Always shows command prompt | N/A |
| Calculator | N/A | -- | Always shows "0" in display | N/A |
| Desktop (no windows open) | NO | `Desktop.svelte` | Empty desktop with icons and taskbar, no guidance | BAD -- first-time user has no idea what to do |
| StartMenu (no recent) | PARTIAL | `StartMenu.svelte` | Shows "No recent apps" text | POOR -- no visual treatment, just text |

**Fix for Desktop empty state**: Add a first-visit hint. In `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte`, after the windows layer (after line 637), add:

```svelte
<!-- First-visit hint (shows when no windows have ever been opened) -->
{#if wm.windows.length === 0 && !isLoading}
  <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
    <p class="text-slate-500 text-desktop-sm animate-pulse">
      Right-click the desktop or press <kbd class="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 text-desktop-xs font-mono">Ctrl+Space</kbd> to get started
    </p>
  </div>
{/if}
```

**Fix for Notes empty state**: Add an icon and improve the copy:

Old:
```
No notes yet. Click + to create one
```
New (with SVG notepad icon above):
```
No notes yet
Create your first note with the + button above
```

---

### 11. Loading States

| Component | Loading State? | File | Implementation | Quality |
|-----------|---------------|------|----------------|---------|
| Boot screen | YES | `Desktop.svelte:656-770` | Progress bar + boot messages + shimmer + orbiting dots + pulsing glow | OVER-DESIGNED -- 3.5s forced wait with excessive animation |
| Pyodide in Code Editor | YES | `CodeEditor.svelte` | Status text "Loading Python..." + spinner | GOOD -- informative, non-blocking |
| AI Chat streaming | YES | `AIChat.svelte` | Animated dots in assistant bubble | GOOD -- matches content shape |
| File Browser loading | YES | `FileBrowser.svelte` | Spinner + "Loading files..." text | ADEQUATE -- standard pattern |
| Plugin federation offline | YES | `FederationOffline.svelte` | Error state with retry button | GOOD -- actionable |
| Window opening | YES | `Window.svelte:777-778` | 250ms scale-up animation | GOOD -- fast, subtle |
| StartMenu | NO | `StartMenu.svelte` | Instant render (no loading needed) | CORRECT -- no async data |
| AppLauncher | NO | `AppLauncher.svelte` | Instant render | CORRECT -- no async data |

The boot screen is the only loading state that needs fixing (covered in Finding 1). All other loading states are adequate or good.

---

## PHASE 3: POLISH (Delight opportunities)

### 12. Glass Morphism: Inconsistent Definitions

The `.glass-panel` class and glass effects are defined in **three different locations** with **different values**:

| Location | File:Line | Background | Blur | Border | Box Shadow |
|----------|-----------|-----------|------|--------|-----------|
| Global definition | `app.css:216-224` | `rgba(15, 23, 42, 0.75)` | `blur(20px)` | `rgba(99, 102, 241, 0.15)` | `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)` |
| DesktopWidgets override | `DesktopWidgets.svelte:751-760` (scoped `<style>`) | `rgba(15, 23, 42, 0.85)` | `blur(24px)` | `rgba(99, 102, 241, 0.12)` | `0 20px 40px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)` |
| Window chrome | `Window.svelte:411-424` | gradient `0.95/0.92/0.98` | `blur(24px) saturate(180%)` | `rgba(148, 163, 184, 0.12)` | See shadow classes |
| Taskbar | `Taskbar.svelte:426-437` | gradient `0.85/0.9` | `blur(20px) saturate(180%)` | `rgba(255, 255, 255, 0.1)` | `0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)` |

The DesktopWidgets scoped `.glass-panel` override (line 751) overrides the global definition only within that component, creating a subtle visual mismatch between:
- The system tray panel (uses DesktopWidgets' 0.85 opacity, 24px blur)
- The boot screen panel, context menus (use global 0.75 opacity, 20px blur)

**Fix**: Create one definitive glass-panel system using CSS custom properties.

Replace the global `.glass-panel` in `/home/rdtect/Projects/personal/desktop-os/src/app.css:216-224`:

Old:
```css
.glass-panel {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(99, 102, 241, 0.15);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

New:
```css
:root {
  --glass-bg: rgba(15, 23, 42, 0.8);
  --glass-blur: blur(20px) saturate(180%);
  --glass-border: rgba(99, 102, 241, 0.15);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow:
    var(--glass-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Elevated variant: popups, dropdowns, modals */
.glass-panel--elevated {
  --glass-bg: rgba(15, 23, 42, 0.9);
  --glass-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

/* Subtle variant: tooltips, inline panels */
.glass-panel--subtle {
  --glass-bg: rgba(15, 23, 42, 0.6);
  --glass-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
```

Then remove the scoped `.glass-panel` override from `DesktopWidgets.svelte:751-760` and use `.glass-panel--elevated` class instead on the system tray and popup panels.

---

### 13. Responsiveness: Desktop-Only

Only one plugin (`AboutMe.svelte`) has responsive breakpoints (at 640px with `@media (min-width: 640px)`). All shell components assume a full desktop viewport.

| Component | Issue at < 1024px | File |
|-----------|-------------------|------|
| Taskbar | All pinned icons rendered in a single row. With 14 apps pinned, the taskbar extends beyond viewport. No overflow handling. | `Taskbar.svelte:255-354` |
| StartMenu | Fixed `w-[600px]` width. On a 768px viewport, this leaves only 84px margin on each side. On 600px viewport, it overflows. | `StartMenu.svelte` |
| DesktopIcons | 88px fixed grid with absolute positioning. Icons at positions beyond viewport are unreachable. | `DesktopIcons.svelte` |
| Windows | Min-width constraints on windows (e.g., Calculator default 380px width) may exceed narrow viewports. | Various plugin manifests |
| DesktopWidgets | System tray fixed at `top-4 right-4`. Quick settings panel is `w-80` (320px). On narrow viewports, it may overlap with desktop icons. | `DesktopWidgets.svelte:337` |
| AppLauncher | Uses 4-7 column grid (`grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7`). Actually handles responsiveness OK. | `AppLauncher.svelte` |

**Fix**: For a portfolio desktop environment that will primarily be viewed on desktop monitors, full responsive support is not critical. However, add a viewport warning for small screens:

Add to `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte`, inside the root `<div>`:

```svelte
<!-- Small viewport warning -->
<div class="fixed inset-0 z-[9999] bg-desktop-bg flex items-center justify-center p-8 text-center md:hidden">
  <div>
    <div class="text-4xl mb-4">🖥</div>
    <h2 class="text-desktop-lg font-semibold text-white mb-2">Desktop Experience</h2>
    <p class="text-desktop-base text-slate-400">rdtect OS is designed for desktop viewports. Please visit on a device with a screen width of 768px or larger.</p>
  </div>
</div>
```

---

### 14. Dark/Light Mode: Non-Functional Toggle

File: `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte:530-549`

The Quick Settings panel contains a "Dark Mode" toggle that calls `theme.toggle()`. However:

1. No light theme tokens are defined in `/home/rdtect/Projects/personal/desktop-os/tailwind.config.js` -- only dark values exist (`#0f172a`, `#1e293b`, `#334155`, `#6366f1`)
2. All hardcoded colors throughout the codebase are dark-only: `rgba(15, 23, 42, ...)` in glass panels, `#0f172a` in backgrounds, etc.
3. Every plugin uses hardcoded dark colors, not CSS custom properties that could switch
4. The `theme.ts` module may toggle an internal state, but nothing in the UI responds to it

This is a **broken feature** that misleads users into thinking they can change the theme.

**Fix**: Remove the non-functional toggle. It is better to have no toggle than a broken one.

Delete lines 529-549 from `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte`:

```svelte
<!-- DELETE THIS ENTIRE BLOCK -->
<!-- Theme Toggle -->
<div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
  <div class="flex items-center gap-3">
    <svg class="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
      {#if theme.activeThemeId === 'dark'}
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
      {:else}
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
      {/if}
    </svg>
    <span class="text-sm text-slate-200">Dark Mode</span>
  </div>
  <button
    onclick={toggleTheme}
    aria-label="Toggle dark mode"
    class="relative w-12 h-6 bg-slate-700 rounded-full transition-colors duration-300 {theme.activeThemeId === 'dark' ? 'bg-desktop-accent' : ''}"
  >
    <span
      class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 {theme.activeThemeId === 'dark' ? 'translate-x-6' : ''}"
    ></span>
  </button>
</div>
```

Also remove the `toggleTheme` function (line 164-166) and the `import { theme }` (line 3) if it becomes unused.

---

### 15. Iconography: Three Systems Mixed

The application uses three different icon systems simultaneously:

| System | Where Used | Examples | Rendering Consistency |
|--------|-----------|---------|----------------------|
| Native emoji | Desktop icons, context menus, app icons, file browser file type indicators | Calculator emoji, Terminal emoji, pin emoji in Notes, folder/file emojis in context menu (`'📂'`, `'🗑️'`, `'➕'`, `'📊'`, etc.) | POOR -- renders differently on Windows vs macOS vs Linux. Windows emoji are flat and colorful; macOS are 3D; Linux varies by distribution |
| Inline SVG | Taskbar system tray, window traffic lights, quick settings toggles, calendar nav | WiFi bars, volume speaker, battery, close/minimize/maximize, chevron arrows | GOOD -- consistent cross-platform |
| HTML entities / special characters | Calculator buttons, Code Editor file type icons, various UI elements | `&#9654;` (play triangle), `&#128013;` (snake emoji for Python), `&times;` (multiplication sign) | MIXED -- some are emoji (platform-dependent), some are Unicode symbols (consistent) |

Specific problematic instances:

| File | Line | Value | Issue |
|------|------|-------|-------|
| `Desktop.svelte:325` | `icon: '📂'` | Context menu "Open" uses emoji folder | Platform-dependent rendering |
| `Desktop.svelte:328` | `icon: '< >'` | Context menu "View Source Code" uses plain text, not even an icon | Inconsistent with emoji icons on adjacent items |
| `Desktop.svelte:459` | `icon: '➕'` | Context menu "New" uses emoji plus | Should be SVG for consistency with tray icons |
| `CodeEditor.svelte:274` | `&#128013;` | Python file tab icon (snake emoji via HTML entity) | May not render on all systems |
| Context menus throughout | Various | Mix of emoji (`'🔄'`, `'🖼️'`, `'🖥️'`, `'💻'`) for menu items | All different visual weights and sizes |

**Fix for v1**: Accept emoji for app icons at large display sizes (taskbar 2xl, desktop icons 3xl) -- they work well enough at those sizes and are easy to change. Standardize all small UI icons (context menu items, toolbar buttons, status indicators) to inline SVG. This is a large migration best done incrementally.

**Immediate fix**: Replace the text-based "< >" icon in context menu with an SVG code icon:

`Desktop.svelte:328`:
Old: `icon: '< >'`
New: `icon: '</>'` (at minimum use a more recognizable code symbol, or better yet, render this as SVG in the ContextMenu component)

---

## JOBS FILTER RESULTS

### Remove Until It Breaks

| Element | File:Line | Remove? | Breaks Without It? | Verdict |
|---------|-----------|---------|--------------------|---------| 
| Boot screen social links | `Desktop.svelte:717-730` | YES | No | **REMOVE** |
| Boot screen tech badges | `Desktop.svelte:733-738` | YES | No | **REMOVE** |
| Boot screen author info | `Desktop.svelte:708-714` | YES | No | **REMOVE** |
| Boot screen version number | `Desktop.svelte:702` | YES | No | **REMOVE** |
| Boot screen orbiting dots | `Desktop.svelte:676-687` | YES | No -- logo works without orbital animation | **REMOVE** |
| Boot screen shimmer overlay | `Desktop.svelte:666` | YES | No | **REMOVE** |
| Boot screen pulsing glow | `Desktop.svelte:673` | YES | No -- logo visible without glow | **REMOVE** |
| Boot screen text-glow animation | `Desktop.svelte:697` | YES | No -- title readable without glow animation | **REMOVE** |
| Boot screen (entire) | `Desktop.svelte:656-770` | MAYBE | Slightly jarring instant load | **SIMPLIFY** to 800ms logo + progress |
| Background grid pattern | `Desktop.svelte:558` | YES | No | **REMOVE** |
| Background noise texture | `Desktop.svelte:560` | YES | No | **REMOVE** |
| Background radial overlay | `Desktop.svelte:556` | YES | No -- aurora already provides color | **REMOVE** |
| Background particles (5 dots) | `Desktop.svelte:612-618` | YES | No | **REMOVE** |
| Background SVG monogram | `Desktop.svelte:565-576` | YES | No | **REMOVE** |
| Background geometric circles | `Desktop.svelte:579-583` | YES | No | **REMOVE** |
| Background geometric triangle | `Desktop.svelte:586-589` | YES | No | **REMOVE** |
| Background geometric diamond | `Desktop.svelte:592-596` | YES | No | **REMOVE** |
| Background geometric rotated square | `Desktop.svelte:598-602` | YES | No | **REMOVE** |
| Background "rdtect" text watermark (180px) | `Desktop.svelte:605-609` | YES | No | **REMOVE** |
| Dark mode toggle (broken) | `DesktopWidgets.svelte:530-549` | YES | No -- it does nothing | **REMOVE** |
| Plugin type badges on tooltips | `Taskbar.svelte:272-274, 324-325` | MAYBE | No, but useful info for portfolio context | **KEEP** -- they demonstrate plugin architecture knowledge |
| `animate-breathe` class + keyframe | `app.css:284-291` | YES | Not used in any component | **REMOVE** |
| `animate-float` class + keyframe | `app.css:18-21, 91-93` | YES | Only used on one geometric shape (being removed) | **REMOVE** |
| `bg-icon-gradient` class | `app.css:192-195` | CHECK | Need to verify usage | Check if used; if not, **REMOVE** |
| `bg-titlebar-gradient` class | `app.css:198-200` | CHECK | Need to verify usage | Check if used; if not, **REMOVE** |
| `duration-600` utility | `app.css:442-444` | YES | Used only on boot screen fade-out, which can use Tailwind `duration-500` | **REMOVE** |

**Total removable elements**:
- ~180 lines of CSS from `app.css` (dead animations, unused classes, duplicate definitions)
- ~110 lines of Svelte markup from `Desktop.svelte` (background decorations + boot screen bloat)
- ~20 lines from `DesktopWidgets.svelte` (non-functional dark mode toggle)
- **Total: ~310 lines of dead/harmful code**

---

## DESIGN SYSTEM UPDATES

### 1. Update Tailwind Config

File: `/home/rdtect/Projects/personal/desktop-os/tailwind.config.js`

Full replacement:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}', './plugins/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        desktop: {
          bg: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          accent: '#6366f1',
          'accent-hover': '#818cf8',
          muted: '#94a3b8',
          subtle: '#64748b',
        }
      },
      fontSize: {
        'desktop-xs': ['11px', { lineHeight: '16px' }],
        'desktop-sm': ['13px', { lineHeight: '20px' }],
        'desktop-base': ['14px', { lineHeight: '22px' }],
        'desktop-lg': ['16px', { lineHeight: '24px' }],
        'desktop-xl': ['20px', { lineHeight: '28px' }],
        'desktop-2xl': ['28px', { lineHeight: '36px' }],
      },
      borderRadius: {
        'desktop-sm': '8px',
        'desktop-md': '12px',
        'desktop-lg': '16px',
        'desktop-xl': '24px',
      },
    }
  },
  plugins: [require('@tailwindcss/forms')]
};
```

Key changes:
- Added `./plugins/**/*.{html,js,svelte,ts}` to `content` array (ensures plugin Tailwind classes are scanned)
- Added `accent-hover`, `muted`, `subtle` color tokens
- Added `fontSize` scale with 6 sizes
- Added `borderRadius` scale with 4 sizes

### 2. Update app.css Glass Panel System

Replace `/home/rdtect/Projects/personal/desktop-os/src/app.css` lines 215-224 with:

```css
/* Glass Morphism Design System */
:root {
  --glass-bg: rgba(15, 23, 42, 0.8);
  --glass-blur: blur(20px) saturate(180%);
  --glass-border: rgba(99, 102, 241, 0.15);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow:
    var(--glass-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.glass-panel--elevated {
  --glass-bg: rgba(15, 23, 42, 0.9);
  --glass-blur: blur(24px) saturate(180%);
  --glass-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.glass-panel--subtle {
  --glass-bg: rgba(15, 23, 42, 0.6);
  --glass-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
```

### 3. Add Reduced Motion Support

Add at the END of `/home/rdtect/Projects/personal/desktop-os/src/app.css`:

```css
/* ====================================
   Accessibility: Reduced Motion
   ==================================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## COMPLETE IMPLEMENTATION TABLE

| # | Priority | File (absolute path) | Line(s) | Change Description | Old Value | New Value | Effort |
|---|----------|---------------------|---------|-------------------|-----------|-----------|--------|
| 1 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | 55-61 | Reduce boot timeout | `setTimeout(..., 3500)` | `setTimeout(..., 800)` | S |
| 2 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | 49-52 | Remove profile fade-in delay | `setTimeout(() => { showProfile = true; }, 800)` | Delete timeout + `showProfile` state variable (line 24) | S |
| 3 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | 656-770 | Replace boot screen with simplified version | 114 lines of boot screen markup with social links, tech badges, author info, orbiting dots, shimmer, glow animations | Simplified 25-line version: logo + title + progress bar + boot message (see Finding 1 for full replacement code) | M |
| 4 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | 563-619 | Remove ALL background decorative layers | SVG monogram, 4 geometric shapes, "rdtect" text watermark, 5 particles = 57 lines of markup | Delete entire block. Keep only `<div class="bg-desktop-aurora"></div>` (line 554) | S |
| 5 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | 556-560 | Remove overlay, grid, and noise divs | Three `<div>` layers: `.bg-desktop-overlay`, `.bg-desktop-grid`, `.bg-desktop-noise` | Delete these three divs. Background becomes: gradient div > aurora div only | S |
| 6 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 131-151 | Remove unused CSS classes | `.bg-desktop-overlay`, `.bg-desktop-grid`, `.bg-desktop-noise` definitions | Delete these class definitions | S |
| 7 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 450-596 | Remove all wallpaper branding CSS | `@keyframes float-slow`, `float-drift`, `float-reverse`, `spin-very-slow`, `particle-float`, `aurora-move-3`; `.particles-container`, `.particle`, `.particle-1` through `.particle-5`; `.animate-float-slow`, `.animate-float-drift`, `.animate-float-reverse`, `.animate-spin-very-slow`; `.aurora-third`; enhanced aurora overrides | Delete all 146 lines | M |
| 8 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 23-110 | Remove duplicate window animation definitions | `@keyframes window-open/minimize/maximize/restore` + `.animate-window-open/minimize/maximize/restore` + `.animate-float` + `@keyframes float` | Delete lines 18-110 except keep `@keyframes preview-in` (79-88) and `.animate-preview-in` (112-114) | M |
| 9 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 227-241 | Remove duplicate window-close definition | `@keyframes window-close` + `.animate-window-close` | Delete (scoped version in Window.svelte takes precedence) | S |
| 10 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | After 630 | Add reduced motion support | (none) | Add `@media (prefers-reduced-motion: reduce)` rule (see Design System Updates section 3) | S |
| 11 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte` | 291-298 | Add aria-label to close button | `title="Close"` only | Add `aria-label="Close window"` | S |
| 12 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte` | 300-307 | Add aria-label to minimize button | `title="Minimize"` only | Add `aria-label="Minimize window"` | S |
| 13 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte` | 309-313 | Add aria-label to maximize button | `title={win.isMaximized ? 'Restore' : 'Maximize'}` only | Add `aria-label={win.isMaximized ? 'Restore window' : 'Maximize window'}` | S |
| 14 | P0 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Window.svelte` | 521-533 | Increase traffic light touch target | `width: 12px; height: 12px;` (hit area = 12px) | Add `::after { content: ''; position: absolute; inset: -16px; border-radius: 50%; }` for 44px hit area | S |
| 15 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/terminal/src/Terminal.svelte` | Style block | Change Terminal background to match OS | `background: #0d1117` | `background: #0f172a` | S |
| 16 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/terminal/src/Terminal.svelte` | Style block | Change prompt color to system palette | `color: #33ff33` | `color: #4ec9b0` | S |
| 17 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/terminal/src/Terminal.svelte` | Style block | Change command output color | `color: #58a6ff` | `color: #818cf8` | S |
| 18 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/terminal/src/Terminal.svelte` | Style block | Change error color | `color: #f85149` | `color: #f87171` | S |
| 19 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/terminal/src/Terminal.svelte` | Style block | Change system message color | `color: #8b949e` | `color: #94a3b8` | S |
| 20 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/code-editor/src/CodeEditor.svelte` | ~326 | Change editor background | `background: #1e1e1e` | `background: #0f172a` | S |
| 21 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/code-editor/src/CodeEditor.svelte` | Style block | Change toolbar background | `background: #252526` | `background: #1e293b` | S |
| 22 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/code-editor/src/CodeEditor.svelte` | ~394-416 | Change run button color to desktop-accent | `background-color: #0e639c` / `hover: #1177bb` | `background-color: #6366f1` / `hover: #818cf8` | S |
| 23 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/code-editor/src/CodeEditor.svelte` | Style block | Change tab bar background | `background: #252526; border-bottom: 1px solid #1e1e1e` | `background: #1e293b; border-bottom: 1px solid #334155` | S |
| 24 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/code-editor/src/CodeEditor.svelte` | Style block | Change active tab background | `background: #1e1e1e` | `background: #0f172a` | S |
| 25 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/code-editor/src/CodeEditor.svelte` | Style block | Change tab text color | `color: #969696` | `color: #94a3b8` | S |
| 26 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/code-editor/src/CodeEditor.svelte` | Style block | Change status bar color | `background: #007acc` | `background: #6366f1` | S |
| 27 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/notes/src/Notes.svelte` | Shadow DOM styles | Change amber accent to indigo | `#fbbf24` (all instances: pin, new note btn, active indicator) | `#6366f1` | M |
| 28 | P1 | `/home/rdtect/Projects/personal/desktop-os/plugins/notes/src/Notes.svelte` | Shadow DOM styles | Change amber hover to indigo hover | `#f59e0b` | `#818cf8` | S |
| 29 | P1 | `/home/rdtect/Projects/personal/desktop-os/tailwind.config.js` | 4-14 | Add type scale, border-radius scale, additional color tokens | Current minimal config | Full config with `fontSize`, `borderRadius`, additional `colors` (see Design System Updates section 1) | S |
| 30 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte` | 530-549 | Remove non-functional dark mode toggle | 20 lines of toggle markup | Delete entire block | S |
| 31 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte` | 164-166 | Remove toggleTheme function (if unused after toggle removal) | `function toggleTheme() { theme.toggle(); }` | Delete function | S |
| 32 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 284-291 | Remove unused `breathe` animation | `@keyframes breathe` + `.animate-breathe` | Delete 8 lines | S |
| 33 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 346-363 | Remove shimmer animations (unused after boot simplification) | `@keyframes shimmer`, `@keyframes progress-shimmer`, `.animate-shimmer`, `.animate-progress-shimmer` | Delete 18 lines | S |
| 34 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 366-393 | Remove spin-slow/reverse/slower (unused after background + boot cleanup) | `@keyframes spin-slow`, `spin-reverse`, `spin-slower` + `.animate-spin-slow`, `.animate-spin-reverse`, `.animate-spin-slower` | Delete 28 lines | S |
| 35 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 396-438 | Remove boot-only animations | `@keyframes logo-pulse`, `pulse-glow-bg`, `text-glow` + `.animate-logo-pulse`, `.animate-pulse-glow` (second definition), `.animate-text-glow` | Delete 42 lines | S |
| 36 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 442-444 | Remove `duration-600` utility | `.duration-600 { transition-duration: 600ms; }` | Delete (use Tailwind `duration-500` in boot screen) | S |
| 37 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Taskbar.svelte` | 335 | Add focus-visible styles to taskbar icons | `class="taskbar-icon relative w-11 h-11 ..."` | Add `focus-visible:ring-2 focus-visible:ring-desktop-accent focus-visible:ring-offset-1 focus-visible:ring-offset-desktop-bg` | S |
| 38 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Taskbar.svelte` | 242 | Add focus-visible styles to Start button | `class="start-button group relative w-11 h-11 ..."` | Add `focus-visible:ring-2 focus-visible:ring-desktop-accent focus-visible:ring-offset-1 focus-visible:ring-offset-desktop-bg` | S |
| 39 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte` | 674-685 | Add aria-labels to calendar day buttons | `<button class="w-9 h-9 ...">` | Add `aria-label="{monthNames[currentMonth]} {day}, {currentYear}{isToday ? ' (today)' : ''}"` | S |
| 40 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | 702 | Fix color contrast on boot version text | `text-slate-600` | `text-slate-400` | S |
| 41 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte` | 681 | Fix color contrast on non-current-month calendar days | `text-slate-600` | `text-slate-500` (minimum) or `text-slate-400` (recommended) | S |
| 42 | P1 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Taskbar.svelte` | 255 | Fix tight taskbar icon gap | `gap-0.5` | `gap-1` | S |
| 43 | P2 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 216-224 | Refactor glass-panel to CSS custom properties | Single `.glass-panel` class | CSS custom properties with `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow` + `.glass-panel--elevated` + `.glass-panel--subtle` variants (see Design System Updates section 2) | M |
| 44 | P2 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopWidgets.svelte` | 751-760 | Remove local glass-panel override | Scoped `.glass-panel { background: rgba(15,23,42,0.85); ... }` | Delete scoped override. Add `glass-panel--elevated` class to system tray and popup panels in markup | S |
| 45 | P2 | Multiple plugin files | Various | Migrate arbitrary font sizes to design tokens | `text-[10px]`, `text-[11px]`, `text-[13px]`, `text-[9px]` | `text-desktop-xs`, `text-desktop-sm`, etc. per type scale | L |
| 46 | P2 | `/home/rdtect/Projects/personal/desktop-os/plugins/file-browser/src/FileBrowser.svelte` | Context menu code | Replace custom context menu with shared shell ContextMenu | Custom inline context menu rendering | Emit `contextmenu:show` event via event bus; Desktop.svelte renders shared ContextMenu | L |
| 47 | P2 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/DesktopIcons.svelte` | Icon `{#each}` block | Add keyboard navigation to desktop icons | `<div class="icon ..." ondblclick={...}>` | Add `role="button" tabindex="0" aria-label="Open {app.title}" onkeydown={(e) => { if (e.key === 'Enter' \|\| e.key === ' ') { e.preventDefault(); wm.openWindow(app.id); } }}` | S |
| 48 | P2 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 564-576 | Reduce aurora opacity | `rgba(99,102,241, 0.18)`, `rgba(139,92,246, 0.12)` (before); `rgba(139,92,246, 0.12)`, `rgba(168,85,247, 0.08)` (after) | `rgba(99,102,241, 0.10)`, `rgba(139,92,246, 0.06)` (before); `rgba(139,92,246, 0.06)`, `rgba(168,85,247, 0.04)` (after) | S |
| 49 | P3 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | After 637 | Add first-visit empty state hint | (none) | Add centered hint: "Right-click the desktop or press Ctrl+Space to get started" (see Finding 10 for code) | S |
| 50 | P3 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | After 550 | Add small viewport warning | (none) | Add `md:hidden` overlay: "rdtect OS is designed for desktop viewports" (see Finding 13 for code) | S |
| 51 | P3 | `/home/rdtect/Projects/personal/desktop-os/src/lib/shell/Desktop.svelte` | 328 | Fix inconsistent icon in context menu | `icon: '< >'` | `icon: '</>'` | S |
| 52 | P3 | `/home/rdtect/Projects/personal/desktop-os/src/app.css` | 192-200 | Remove unused gradient utility classes | `.bg-icon-gradient`, `.bg-titlebar-gradient` | Verify no usage, then delete. Keep `.bg-preview-gradient` if used. | S |

**Effort scale**: S = < 30 minutes, M = 1-2 hours, L = 3+ hours

**Summary by priority**:
- **P0 (Critical)**: 14 items -- boot screen simplification, background cleanup, dead CSS removal, accessibility essentials
- **P1 (Important)**: 28 items -- plugin color unification, type scale, unused animation removal, focus styles, contrast fixes
- **P2 (Refinement)**: 6 items -- glass panel system, font size migration, context menu unification, keyboard nav
- **P3 (Polish)**: 4 items -- empty states, viewport warning, minor icon fix, dead CSS

**Estimated total effort**: ~20-25 hours for full implementation of all 52 items

---

## KEY DESIGN LESSONS

1. **Self-promotion is anti-user**: Boot screens, watermarks, and tech badges serve the developer, not the person using the product. The portfolio value comes from the quality of the experience, not from stamping your name everywhere. A user who opens this and sees a polished, fast desktop is far more impressed than one forced to watch a 3.5-second branded loading screen.

2. **Visual layers compound exponentially**: Each background layer alone is subtle (3% opacity noise, 4% opacity shapes). But 8 layers at 3-4% each create a visually muddy, GPU-expensive backdrop. The aurora alone provides enough depth and movement. One well-executed effect beats seven subtle ones.

3. **Design systems require discipline, not just tokens**: Having `desktop-bg`, `desktop-surface`, `desktop-border`, and `desktop-accent` in Tailwind config is a start. But when 3 of 8 plugins ignore these tokens entirely, the system is decorative rather than structural. Tokens only work when they are the ONLY way to express color in the codebase.

4. **Accessibility suppression is design debt**: Every `svelte-ignore a11y_*` comment is a conscious decision to exclude users. A portfolio piece that demonstrates accessibility awareness is far more impressive to technical reviewers than one with fancy animations.

5. **Animation budgets exist**: 45 keyframe animations is roughly 40 more than a user will ever consciously notice. The diminishing returns are severe. Budget: 10-15 animations for the entire system. Every additional one must justify its existence.

---

*End of Premium Design Audit*