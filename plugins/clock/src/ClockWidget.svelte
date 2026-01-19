<script lang="ts">
  /**
   * Clock Widget - Desktop Widget
   *
   * A compact clock widget that displays on the desktop.
   * Shares state with ClockApp via clock.svelte.ts
   *
   * Note: Click to open app is handled by the parent context menu.
   * The widget itself is standalone and does not open apps by default.
   */

  import { clockState, type ClockFace } from './clock.svelte';

  // Derived state from shared clock
  let hours = $derived(clockState.now.getHours());
  let minutes = $derived(clockState.now.getMinutes());
  let seconds = $derived(clockState.now.getSeconds());

  // Clock hands angles for analog
  let secondAngle = $derived((seconds / 60) * 360);
  let minuteAngle = $derived(((minutes + seconds / 60) / 60) * 360);
  let hourAngle = $derived((((hours % 12) + minutes / 60) / 12) * 360);

  // Formatted values
  let displayHours = $derived(clockState.settings.use24Hour ? hours : hours % 12 || 12);
  let displayMinutes = $derived(String(minutes).padStart(2, '0'));
  let period = $derived(clockState.settings.use24Hour ? '' : (hours >= 12 ? 'PM' : 'AM'));

  // Next alarm info
  let hasAlarms = $derived(clockState.alarms.some(a => a.enabled));

  function cycleFace(e: MouseEvent) {
    // Left-click cycles through clock faces (digital, analog, minimal)
    e.preventDefault();
    const faces: ClockFace[] = ['digital', 'analog', 'minimal'];
    const currentIndex = faces.indexOf(clockState.settings.clockFace);
    const nextIndex = (currentIndex + 1) % faces.length;
    clockState.setClockFace(faces[nextIndex]);
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="clock-widget" onclick={cycleFace}>
  <!-- Clock Display based on face type -->
  {#if clockState.settings.clockFace === 'analog'}
    <div class="analog-face">
      <svg viewBox="0 0 100 100" class="clock-svg">
        <!-- Clock face -->
        <circle cx="50" cy="50" r="46" class="face-circle" />

        <!-- Hour markers -->
        {#each Array(12) as _, i}
          <line
            x1="50"
            y1="8"
            x2="50"
            y2={i % 3 === 0 ? 14 : 11}
            class="marker"
            class:major={i % 3 === 0}
            transform="rotate({i * 30} 50 50)"
          />
        {/each}

        <!-- Hour hand -->
        <line
          x1="50" y1="50" x2="50" y2="28"
          class="hand hour"
          transform="rotate({hourAngle} 50 50)"
        />

        <!-- Minute hand -->
        <line
          x1="50" y1="50" x2="50" y2="18"
          class="hand minute"
          transform="rotate({minuteAngle} 50 50)"
        />

        <!-- Second hand -->
        <line
          x1="50" y1="55" x2="50" y2="15"
          class="hand second"
          transform="rotate({secondAngle} 50 50)"
        />

        <!-- Center dot -->
        <circle cx="50" cy="50" r="3" class="center" />
      </svg>
    </div>

  {:else if clockState.settings.clockFace === 'minimal'}
    <div class="minimal-face">
      <span class="minimal-time">
        {displayHours}<span class="colon" class:blink={seconds % 2 === 0}>:</span>{displayMinutes}
      </span>
    </div>

  {:else}
    <!-- Digital (default) -->
    <div class="digital-face">
      <span class="time">
        {displayHours}<span class="colon" class:blink={seconds % 2 === 0}>:</span>{displayMinutes}
      </span>
      {#if period}
        <span class="period">{period}</span>
      {/if}
    </div>
  {/if}

  <!-- Date Display -->
  <div class="date">
    {clockState.now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
  </div>

  <!-- Alarm Indicator -->
  {#if hasAlarms}
    <div class="alarm-indicator" title="Alarms set">
      <span class="bell">🔔</span>
    </div>
  {/if}
</div>

<style>
  .clock-widget {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 16px;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
  }

  .clock-widget:hover {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow:
      0 8px 30px rgba(0, 0, 0, 0.4),
      0 0 20px rgba(99, 102, 241, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  /* Digital Face */
  .digital-face {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .time {
    font-size: 32px;
    font-weight: 300;
    color: #e2e8f0;
    font-variant-numeric: tabular-nums;
    letter-spacing: -1px;
  }

  .colon {
    opacity: 1;
    transition: opacity 0.15s ease;
  }

  .colon.blink {
    opacity: 0.3;
  }

  .period {
    font-size: 12px;
    font-weight: 500;
    color: #6366f1;
    margin-left: 2px;
  }

  /* Minimal Face */
  .minimal-face {
    padding: 4px 0;
  }

  .minimal-time {
    font-size: 36px;
    font-weight: 200;
    color: #e2e8f0;
    font-variant-numeric: tabular-nums;
  }

  /* Analog Face */
  .analog-face {
    width: 80px;
    height: 80px;
  }

  .clock-svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.2));
  }

  .face-circle {
    fill: rgba(15, 23, 42, 0.6);
    stroke: rgba(99, 102, 241, 0.3);
    stroke-width: 1.5;
  }

  .marker {
    stroke: #475569;
    stroke-width: 1.5;
  }

  .marker.major {
    stroke: #6366f1;
    stroke-width: 2;
  }

  .hand {
    stroke-linecap: round;
  }

  .hand.hour {
    stroke: #e2e8f0;
    stroke-width: 3;
  }

  .hand.minute {
    stroke: #94a3b8;
    stroke-width: 2;
  }

  .hand.second {
    stroke: #6366f1;
    stroke-width: 1;
  }

  .center {
    fill: #6366f1;
    filter: drop-shadow(0 0 3px rgba(99, 102, 241, 0.8));
  }

  /* Date */
  .date {
    margin-top: 4px;
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Alarm Indicator */
  .alarm-indicator {
    position: absolute;
    top: 6px;
    right: 6px;
    font-size: 12px;
    animation: wiggle 2s ease-in-out infinite;
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(-5deg); }
    50% { transform: rotate(5deg); }
  }

  .bell {
    filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.5));
  }
</style>
