<script lang="ts">
  import { onDestroy } from 'svelte';
  import { clockState, formatTime, formatTimerDuration, getTimeInTimezone, type Alarm, type ClockFace } from './clock.svelte';

  interface Props {
    windowId?: string;
  }

  let { windowId }: Props = $props();

  // Local state
  let newAlarmTime = $state('08:00');
  let newAlarmLabel = $state('');
  let newAlarmDays = $state<number[]>([]);
  let editingAlarmId = $state<string | null>(null);

  let newTimerMinutes = $state(5);
  let newTimerLabel = $state('');

  // Derived from shared state
  const tabs = ['clock', 'alarm', 'timer', 'stopwatch', 'world'] as const;
  const tabLabels = { clock: 'Clock', alarm: 'Alarms', timer: 'Timer', stopwatch: 'Stopwatch', world: 'World' };
  const tabIcons = { clock: '🕐', alarm: '⏰', timer: '⏱️', stopwatch: '🏃', world: '🌍' };

  const clockFaces: { id: ClockFace; label: string; icon: string }[] = [
    { id: 'digital', label: 'Digital', icon: '🔢' },
    { id: 'analog', label: 'Analog', icon: '🕰️' },
    { id: 'minimal', label: 'Minimal', icon: '⚪' },
    { id: 'flip', label: 'Flip', icon: '📟' },
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Time components for analog clock
  let hours = $derived(clockState.now.getHours() % 12);
  let minutes = $derived(clockState.now.getMinutes());
  let seconds = $derived(clockState.now.getSeconds());

  // Hand angles
  let secondAngle = $derived((seconds / 60) * 360);
  let minuteAngle = $derived(((minutes + seconds / 60) / 60) * 360);
  let hourAngle = $derived(((hours + minutes / 60) / 12) * 360);

  // Flip clock digits
  let flipHours = $derived(String(clockState.settings.use24Hour ? clockState.now.getHours() : clockState.now.getHours() % 12 || 12).padStart(2, '0'));
  let flipMinutes = $derived(String(minutes).padStart(2, '0'));
  let flipSeconds = $derived(String(seconds).padStart(2, '0'));

  function handleAddAlarm() {
    if (!newAlarmTime) return;
    clockState.addAlarm({
      time: newAlarmTime,
      label: newAlarmLabel || 'Alarm',
      enabled: true,
      days: [...newAlarmDays],
      sound: 'chime',
    });
    newAlarmTime = '08:00';
    newAlarmLabel = '';
    newAlarmDays = [];
  }

  function toggleDay(day: number) {
    if (newAlarmDays.includes(day)) {
      newAlarmDays = newAlarmDays.filter(d => d !== day);
    } else {
      newAlarmDays = [...newAlarmDays, day];
    }
  }

  function handleAddTimer() {
    if (newTimerMinutes <= 0) return;
    clockState.addTimer(newTimerLabel || `${newTimerMinutes} min timer`, newTimerMinutes * 60);
    newTimerMinutes = 5;
    newTimerLabel = '';
  }
</script>

<div class="clock-app">
  <!-- Tab Bar -->
  <div class="tab-bar">
    {#each tabs as tab}
      <button
        class="tab-btn"
        class:active={clockState.activeTab === tab}
        onclick={() => clockState.setActiveTab(tab)}
      >
        <span class="tab-icon">{tabIcons[tab]}</span>
        <span class="tab-label">{tabLabels[tab]}</span>
      </button>
    {/each}
  </div>

  <!-- Content Area -->
  <div class="content">
    {#if clockState.activeTab === 'clock'}
      <!-- Clock Face Selector -->
      <div class="face-selector">
        {#each clockFaces as face}
          <button
            class="face-btn"
            class:active={clockState.settings.clockFace === face.id}
            onclick={() => clockState.setClockFace(face.id)}
            title={face.label}
          >
            {face.icon}
          </button>
        {/each}
      </div>

      <!-- Clock Display -->
      <div class="clock-display">
        {#if clockState.settings.clockFace === 'digital'}
          <div class="digital-clock">
            <span class="time-main">{clockState.formattedTime}</span>
            <span class="date-display">
              {clockState.now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>

        {:else if clockState.settings.clockFace === 'analog'}
          <div class="analog-clock">
            <svg viewBox="0 0 200 200" class="clock-svg">
              <!-- Clock face -->
              <circle cx="100" cy="100" r="95" class="clock-face" />

              <!-- Hour markers -->
              {#each Array(12) as _, i}
                <line
                  x1="100"
                  y1="15"
                  x2="100"
                  y2={i % 3 === 0 ? 25 : 20}
                  class="hour-marker"
                  class:major={i % 3 === 0}
                  transform="rotate({i * 30} 100 100)"
                />
              {/each}

              <!-- Hour hand -->
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="50"
                class="hand hour-hand"
                transform="rotate({hourAngle} 100 100)"
              />

              <!-- Minute hand -->
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                class="hand minute-hand"
                transform="rotate({minuteAngle} 100 100)"
              />

              <!-- Second hand -->
              <line
                x1="100"
                y1="110"
                x2="100"
                y2="25"
                class="hand second-hand"
                transform="rotate({secondAngle} 100 100)"
              />

              <!-- Center dot -->
              <circle cx="100" cy="100" r="5" class="center-dot" />
            </svg>
          </div>

        {:else if clockState.settings.clockFace === 'minimal'}
          <div class="minimal-clock">
            <span class="minimal-time">
              {String(clockState.settings.use24Hour ? clockState.now.getHours() : clockState.now.getHours() % 12 || 12).padStart(2, '0')}
              <span class="minimal-colon" class:blink={seconds % 2 === 0}>:</span>
              {String(minutes).padStart(2, '0')}
            </span>
          </div>

        {:else if clockState.settings.clockFace === 'flip'}
          <div class="flip-clock">
            <div class="flip-group">
              <div class="flip-card">{flipHours[0]}</div>
              <div class="flip-card">{flipHours[1]}</div>
            </div>
            <span class="flip-colon">:</span>
            <div class="flip-group">
              <div class="flip-card">{flipMinutes[0]}</div>
              <div class="flip-card">{flipMinutes[1]}</div>
            </div>
            {#if clockState.settings.showSeconds}
              <span class="flip-colon">:</span>
              <div class="flip-group">
                <div class="flip-card flip-seconds">{flipSeconds[0]}</div>
                <div class="flip-card flip-seconds">{flipSeconds[1]}</div>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Settings -->
      <div class="clock-settings">
        <label class="setting-toggle">
          <input type="checkbox" checked={clockState.settings.use24Hour} onchange={() => clockState.updateSettings({ use24Hour: !clockState.settings.use24Hour })} />
          <span>24-hour format</span>
        </label>
        <label class="setting-toggle">
          <input type="checkbox" checked={clockState.settings.showSeconds} onchange={() => clockState.updateSettings({ showSeconds: !clockState.settings.showSeconds })} />
          <span>Show seconds</span>
        </label>
      </div>

    {:else if clockState.activeTab === 'alarm'}
      <!-- Alarm List -->
      <div class="alarm-section">
        <div class="alarm-list">
          {#each clockState.alarms as alarm (alarm.id)}
            <div class="alarm-item" class:disabled={!alarm.enabled}>
              <div class="alarm-info">
                <span class="alarm-time">{alarm.time}</span>
                <span class="alarm-label">{alarm.label}</span>
                {#if alarm.days.length > 0}
                  <span class="alarm-days">
                    {alarm.days.map(d => dayNames[d]).join(' ')}
                  </span>
                {/if}
              </div>
              <div class="alarm-actions">
                <button
                  class="toggle-btn"
                  class:active={alarm.enabled}
                  onclick={() => clockState.toggleAlarm(alarm.id)}
                >
                  {alarm.enabled ? 'ON' : 'OFF'}
                </button>
                <button class="delete-btn" onclick={() => clockState.deleteAlarm(alarm.id)}>
                  🗑️
                </button>
              </div>
            </div>
          {:else}
            <div class="empty-state">No alarms set</div>
          {/each}
        </div>

        <!-- Add Alarm Form -->
        <div class="add-alarm-form">
          <input type="time" bind:value={newAlarmTime} class="time-input" />
          <input type="text" bind:value={newAlarmLabel} placeholder="Label" class="label-input" />
          <div class="day-selector">
            {#each dayNames as day, i}
              <button
                class="day-btn"
                class:active={newAlarmDays.includes(i)}
                onclick={() => toggleDay(i)}
              >
                {day}
              </button>
            {/each}
          </div>
          <button class="add-btn" onclick={handleAddAlarm}>Add Alarm</button>
        </div>
      </div>

    {:else if clockState.activeTab === 'timer'}
      <!-- Timer Section -->
      <div class="timer-section">
        <div class="timer-list">
          {#each clockState.timers as timer (timer.id)}
            <div class="timer-item" class:running={timer.isRunning} class:done={timer.remaining === 0}>
              <div class="timer-display">
                <span class="timer-time">{formatTimerDuration(timer.remaining)}</span>
                <span class="timer-label">{timer.label}</span>
              </div>
              <div class="timer-controls">
                {#if timer.isRunning}
                  <button class="control-btn pause" onclick={() => clockState.pauseTimer(timer.id)}>⏸️</button>
                {:else if timer.remaining > 0}
                  <button class="control-btn play" onclick={() => clockState.startTimer(timer.id)}>▶️</button>
                {/if}
                <button class="control-btn reset" onclick={() => clockState.resetTimer(timer.id)}>🔄</button>
                <button class="control-btn delete" onclick={() => clockState.deleteTimer(timer.id)}>🗑️</button>
              </div>
            </div>
          {:else}
            <div class="empty-state">No timers set</div>
          {/each}
        </div>

        <!-- Quick Add Timer -->
        <div class="add-timer-form">
          <div class="timer-presets">
            {#each [1, 3, 5, 10, 15, 30] as mins}
              <button class="preset-btn" onclick={() => { newTimerMinutes = mins; handleAddTimer(); }}>
                {mins}m
              </button>
            {/each}
          </div>
          <div class="custom-timer">
            <input type="number" bind:value={newTimerMinutes} min="1" max="999" class="minutes-input" />
            <span>minutes</span>
            <input type="text" bind:value={newTimerLabel} placeholder="Label" class="timer-label-input" />
            <button class="add-btn" onclick={handleAddTimer}>Add</button>
          </div>
        </div>
      </div>

    {:else if clockState.activeTab === 'stopwatch'}
      <!-- Stopwatch Section -->
      <div class="stopwatch-section">
        <div class="stopwatch-display">
          <span class="stopwatch-time">{formatTime(clockState.stopwatchTime)}</span>
        </div>
        <div class="stopwatch-controls">
          {#if clockState.stopwatchRunning}
            <button class="sw-btn stop" onclick={() => clockState.stopStopwatch()}>Stop</button>
            <button class="sw-btn lap" onclick={() => clockState.lapStopwatch()}>Lap</button>
          {:else}
            <button class="sw-btn start" onclick={() => clockState.startStopwatch()}>
              {clockState.stopwatchTime > 0 ? 'Resume' : 'Start'}
            </button>
            {#if clockState.stopwatchTime > 0}
              <button class="sw-btn reset" onclick={() => clockState.resetStopwatch()}>Reset</button>
            {/if}
          {/if}
        </div>
        {#if clockState.stopwatchLaps.length > 0}
          <div class="lap-list">
            {#each clockState.stopwatchLaps as lap (lap.number)}
              <div class="lap-item">
                <span class="lap-num">Lap {lap.number}</span>
                <span class="lap-delta">+{formatTime(lap.delta)}</span>
                <span class="lap-time">{formatTime(lap.time)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    {:else if clockState.activeTab === 'world'}
      <!-- World Clock Section -->
      <div class="world-section">
        <div class="local-time">
          <span class="local-label">Local Time</span>
          <span class="local-display">{clockState.formattedTime}</span>
          <span class="local-zone">{clockState.settings.primaryTimezone}</span>
        </div>
        <div class="world-clocks">
          {#each clockState.settings.worldClocks as wc (wc.id)}
            {@const time = getTimeInTimezone(wc.timezone)}
            {@const hours = clockState.settings.use24Hour ? time.getHours() : time.getHours() % 12 || 12}
            {@const mins = String(time.getMinutes()).padStart(2, '0')}
            {@const period = clockState.settings.use24Hour ? '' : (time.getHours() >= 12 ? ' PM' : ' AM')}
            {@const diff = Math.round((time.getTime() - clockState.now.getTime()) / 3600000)}
            <div class="world-clock-card">
              <span class="wc-city">{wc.city}</span>
              <span class="wc-time">{hours}:{mins}{period}</span>
              <span class="wc-diff">{diff >= 0 ? '+' : ''}{diff}h</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Active Alarm Overlay -->
  {#if clockState.activeAlarm}
    <div class="alarm-overlay">
      <div class="alarm-modal">
        <div class="alarm-icon">⏰</div>
        <div class="alarm-title">{clockState.activeAlarm.label}</div>
        <div class="alarm-time-display">{clockState.activeAlarm.time}</div>
        <div class="alarm-buttons">
          <button class="snooze-btn" onclick={() => clockState.snoozeAlarm(5)}>Snooze 5m</button>
          <button class="dismiss-btn" onclick={() => clockState.dismissAlarm()}>Dismiss</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .clock-app {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
    color: #e2e8f0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Tab Bar */
  .tab-bar {
    display: flex;
    gap: 4px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.8);
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  }

  .tab-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn:hover {
    background: rgba(99, 102, 241, 0.1);
    color: #94a3b8;
  }

  .tab-btn.active {
    background: rgba(99, 102, 241, 0.2);
    color: #6366f1;
  }

  .tab-icon {
    font-size: 20px;
  }

  .tab-label {
    font-size: 10px;
    font-weight: 500;
  }

  /* Content */
  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  /* Face Selector */
  .face-selector {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .face-btn {
    padding: 8px 16px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    color: #94a3b8;
    cursor: pointer;
    font-size: 18px;
    transition: all 0.2s ease;
  }

  .face-btn:hover {
    background: rgba(99, 102, 241, 0.2);
    color: #e2e8f0;
  }

  .face-btn.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: #6366f1;
    color: #6366f1;
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
  }

  /* Clock Display */
  .clock-display {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  /* Digital Clock */
  .digital-clock {
    text-align: center;
  }

  .time-main {
    display: block;
    font-size: 64px;
    font-weight: 300;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 40px rgba(99, 102, 241, 0.3);
    font-variant-numeric: tabular-nums;
  }

  .date-display {
    display: block;
    margin-top: 8px;
    color: #64748b;
    font-size: 14px;
  }

  /* Analog Clock */
  .analog-clock {
    width: 200px;
    height: 200px;
  }

  .clock-svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.2));
  }

  .clock-face {
    fill: rgba(15, 23, 42, 0.8);
    stroke: rgba(99, 102, 241, 0.3);
    stroke-width: 2;
  }

  .hour-marker {
    stroke: #475569;
    stroke-width: 2;
  }

  .hour-marker.major {
    stroke: #6366f1;
    stroke-width: 3;
  }

  .hand {
    stroke-linecap: round;
  }

  .hour-hand {
    stroke: #e2e8f0;
    stroke-width: 4;
  }

  .minute-hand {
    stroke: #94a3b8;
    stroke-width: 3;
  }

  .second-hand {
    stroke: #6366f1;
    stroke-width: 2;
  }

  .center-dot {
    fill: #6366f1;
    filter: drop-shadow(0 0 4px rgba(99, 102, 241, 0.8));
  }

  /* Minimal Clock */
  .minimal-clock {
    text-align: center;
  }

  .minimal-time {
    font-size: 80px;
    font-weight: 200;
    color: #e2e8f0;
    font-variant-numeric: tabular-nums;
    letter-spacing: -2px;
  }

  .minimal-colon {
    opacity: 1;
    transition: opacity 0.2s ease;
  }

  .minimal-colon.blink {
    opacity: 0.3;
  }

  /* Flip Clock */
  .flip-clock {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .flip-group {
    display: flex;
    gap: 4px;
  }

  .flip-card {
    width: 48px;
    height: 72px;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-weight: 600;
    color: #e2e8f0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  .flip-seconds {
    width: 36px;
    height: 54px;
    font-size: 28px;
    color: #6366f1;
  }

  .flip-colon {
    font-size: 40px;
    color: #6366f1;
    margin: 0 4px;
  }

  /* Clock Settings */
  .clock-settings {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid rgba(99, 102, 241, 0.1);
  }

  .setting-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: #94a3b8;
    font-size: 13px;
  }

  .setting-toggle input {
    accent-color: #6366f1;
  }

  /* Alarm Section */
  .alarm-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .alarm-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 250px;
    overflow-y: auto;
  }

  .alarm-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(30, 41, 59, 0.6);
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }

  .alarm-item.disabled {
    opacity: 0.5;
  }

  .alarm-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .alarm-time {
    font-size: 24px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .alarm-label {
    font-size: 12px;
    color: #64748b;
  }

  .alarm-days {
    font-size: 11px;
    color: #6366f1;
  }

  .alarm-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .toggle-btn {
    padding: 6px 12px;
    background: rgba(71, 85, 105, 0.5);
    border: none;
    border-radius: 16px;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn.active {
    background: rgba(99, 102, 241, 0.3);
    color: #6366f1;
  }

  .delete-btn {
    padding: 4px 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s ease;
  }

  .delete-btn:hover {
    opacity: 1;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #64748b;
  }

  /* Add Alarm Form */
  .add-alarm-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: rgba(30, 41, 59, 0.4);
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }

  .time-input, .label-input {
    padding: 10px 14px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 14px;
  }

  .time-input:focus, .label-input:focus {
    outline: none;
    border-color: #6366f1;
  }

  .day-selector {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .day-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(71, 85, 105, 0.4);
    border: 1px solid transparent;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .day-btn:hover {
    background: rgba(99, 102, 241, 0.2);
  }

  .day-btn.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: #6366f1;
    color: #6366f1;
  }

  .add-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  /* Timer Section */
  .timer-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .timer-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .timer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: rgba(30, 41, 59, 0.6);
    border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }

  .timer-item.running {
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
  }

  .timer-item.done {
    border-color: rgba(239, 68, 68, 0.4);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { background: rgba(30, 41, 59, 0.6); }
    50% { background: rgba(239, 68, 68, 0.2); }
  }

  .timer-display {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .timer-time {
    font-size: 32px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: #e2e8f0;
  }

  .timer-label {
    font-size: 12px;
    color: #64748b;
  }

  .timer-controls {
    display: flex;
    gap: 8px;
  }

  .control-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(71, 85, 105, 0.4);
    border: none;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn:hover {
    background: rgba(99, 102, 241, 0.3);
    transform: scale(1.1);
  }

  .add-timer-form {
    padding: 16px;
    background: rgba(30, 41, 59, 0.4);
    border-radius: 12px;
  }

  .timer-presets {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .preset-btn {
    padding: 8px 16px;
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 20px;
    color: #6366f1;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .preset-btn:hover {
    background: rgba(99, 102, 241, 0.3);
    transform: scale(1.05);
  }

  .custom-timer {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .minutes-input {
    width: 60px;
    padding: 8px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 6px;
    color: #e2e8f0;
    text-align: center;
  }

  .timer-label-input {
    flex: 1;
    min-width: 100px;
    padding: 8px 12px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 6px;
    color: #e2e8f0;
  }

  /* Stopwatch Section */
  .stopwatch-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .stopwatch-display {
    padding: 24px;
  }

  .stopwatch-time {
    font-size: 56px;
    font-weight: 300;
    font-variant-numeric: tabular-nums;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .stopwatch-controls {
    display: flex;
    gap: 12px;
  }

  .sw-btn {
    padding: 12px 32px;
    border: none;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sw-btn.start {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white;
  }

  .sw-btn.stop {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
  }

  .sw-btn.lap, .sw-btn.reset {
    background: rgba(71, 85, 105, 0.5);
    color: #e2e8f0;
  }

  .sw-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .lap-list {
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .lap-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
    background: rgba(30, 41, 59, 0.4);
    border-radius: 8px;
    font-size: 13px;
  }

  .lap-num {
    color: #64748b;
  }

  .lap-delta {
    color: #6366f1;
  }

  .lap-time {
    color: #e2e8f0;
    font-variant-numeric: tabular-nums;
  }

  /* World Clock Section */
  .world-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .local-time {
    text-align: center;
    padding: 20px;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 16px;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  .local-label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
  }

  .local-display {
    display: block;
    font-size: 48px;
    font-weight: 300;
    color: #e2e8f0;
  }

  .local-zone {
    display: block;
    font-size: 11px;
    color: #6366f1;
    margin-top: 4px;
  }

  .world-clocks {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .world-clock-card {
    padding: 16px;
    background: rgba(30, 41, 59, 0.6);
    border-radius: 12px;
    text-align: center;
    border: 1px solid rgba(99, 102, 241, 0.1);
    transition: all 0.2s ease;
  }

  .world-clock-card:hover {
    border-color: rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }

  .wc-city {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
  }

  .wc-time {
    display: block;
    font-size: 24px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .wc-diff {
    display: block;
    font-size: 11px;
    color: #6366f1;
    margin-top: 4px;
  }

  /* Alarm Overlay */
  .alarm-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: fade-in 0.3s ease;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .alarm-modal {
    padding: 32px 48px;
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border-radius: 24px;
    text-align: center;
    border: 1px solid rgba(99, 102, 241, 0.3);
    box-shadow: 0 0 60px rgba(99, 102, 241, 0.3);
    animation: scale-in 0.3s ease;
  }

  @keyframes scale-in {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .alarm-icon {
    font-size: 64px;
    animation: shake 0.5s ease-in-out infinite;
  }

  @keyframes shake {
    0%, 100% { transform: rotate(-10deg); }
    50% { transform: rotate(10deg); }
  }

  .alarm-title {
    font-size: 24px;
    font-weight: 600;
    color: #e2e8f0;
    margin-top: 16px;
  }

  .alarm-time-display {
    font-size: 48px;
    font-weight: 300;
    color: #6366f1;
    margin: 8px 0 24px;
  }

  .alarm-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .snooze-btn {
    padding: 12px 24px;
    background: rgba(71, 85, 105, 0.5);
    border: none;
    border-radius: 12px;
    color: #e2e8f0;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dismiss-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .snooze-btn:hover, .dismiss-btn:hover {
    transform: translateY(-2px);
  }
</style>
