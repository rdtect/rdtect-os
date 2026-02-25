<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  // Props from parent
  interface Props {
    windowId?: string;
  }

  let { windowId }: Props = $props();

  // Weather condition types
  type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy' | 'partly-cloudy' | 'night-clear' | 'night-cloudy';

  interface WeatherData {
    location: string;
    temperature: number;
    feelsLike: number;
    condition: WeatherCondition;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    uvIndex: number;
    sunrise: string;
    sunset: string;
    alerts?: { type: string; message: string; severity: 'low' | 'medium' | 'high' }[];
  }

  interface HourlyForecast {
    time: string;
    temperature: number;
    condition: WeatherCondition;
  }

  interface ForecastDay {
    day: string;
    date: string;
    high: number;
    low: number;
    condition: WeatherCondition;
    precipitation: number;
  }

  // Mock weather data for different cities
  const mockWeatherData: Record<string, { current: WeatherData; forecast: ForecastDay[]; hourly: HourlyForecast[] }> = {
    'New York': {
      current: {
        location: 'New York, NY',
        temperature: 72,
        feelsLike: 75,
        condition: 'partly-cloudy',
        humidity: 65,
        windSpeed: 12,
        windDirection: 'NE',
        uvIndex: 6,
        sunrise: '6:45 AM',
        sunset: '7:32 PM'
      },
      hourly: [
        { time: 'Now', temperature: 72, condition: 'partly-cloudy' },
        { time: '1PM', temperature: 74, condition: 'partly-cloudy' },
        { time: '2PM', temperature: 76, condition: 'sunny' },
        { time: '3PM', temperature: 77, condition: 'sunny' },
        { time: '4PM', temperature: 75, condition: 'partly-cloudy' },
        { time: '5PM', temperature: 73, condition: 'cloudy' },
        { time: '6PM', temperature: 70, condition: 'cloudy' },
        { time: '7PM', temperature: 68, condition: 'night-cloudy' },
        { time: '8PM', temperature: 66, condition: 'night-clear' },
        { time: '9PM', temperature: 64, condition: 'night-clear' }
      ],
      forecast: [
        { day: 'Mon', date: 'Jan 20', high: 74, low: 58, condition: 'sunny', precipitation: 0 },
        { day: 'Tue', date: 'Jan 21', high: 78, low: 62, condition: 'partly-cloudy', precipitation: 10 },
        { day: 'Wed', date: 'Jan 22', high: 71, low: 55, condition: 'rainy', precipitation: 80 },
        { day: 'Thu', date: 'Jan 23', high: 68, low: 52, condition: 'cloudy', precipitation: 30 },
        { day: 'Fri', date: 'Jan 24', high: 73, low: 57, condition: 'sunny', precipitation: 5 }
      ]
    },
    'London': {
      current: {
        location: 'London, UK',
        temperature: 58,
        feelsLike: 54,
        condition: 'rainy',
        humidity: 85,
        windSpeed: 18,
        windDirection: 'W',
        uvIndex: 2,
        sunrise: '7:52 AM',
        sunset: '4:23 PM',
        alerts: [{ type: 'Flood Warning', message: 'Heavy rain expected through evening', severity: 'medium' }]
      },
      hourly: [
        { time: 'Now', temperature: 58, condition: 'rainy' },
        { time: '1PM', temperature: 57, condition: 'rainy' },
        { time: '2PM', temperature: 56, condition: 'rainy' },
        { time: '3PM', temperature: 55, condition: 'stormy' },
        { time: '4PM', temperature: 54, condition: 'stormy' },
        { time: '5PM', temperature: 53, condition: 'rainy' },
        { time: '6PM', temperature: 52, condition: 'cloudy' },
        { time: '7PM', temperature: 51, condition: 'night-cloudy' },
        { time: '8PM', temperature: 50, condition: 'night-cloudy' },
        { time: '9PM', temperature: 49, condition: 'night-clear' }
      ],
      forecast: [
        { day: 'Mon', date: 'Jan 20', high: 60, low: 48, condition: 'rainy', precipitation: 90 },
        { day: 'Tue', date: 'Jan 21', high: 55, low: 45, condition: 'cloudy', precipitation: 40 },
        { day: 'Wed', date: 'Jan 22', high: 57, low: 47, condition: 'foggy', precipitation: 20 },
        { day: 'Thu', date: 'Jan 23', high: 62, low: 50, condition: 'partly-cloudy', precipitation: 15 },
        { day: 'Fri', date: 'Jan 24', high: 64, low: 52, condition: 'sunny', precipitation: 0 }
      ]
    },
    'Tokyo': {
      current: {
        location: 'Tokyo, Japan',
        temperature: 82,
        feelsLike: 88,
        condition: 'sunny',
        humidity: 70,
        windSpeed: 8,
        windDirection: 'S',
        uvIndex: 9,
        sunrise: '6:51 AM',
        sunset: '4:56 PM',
        alerts: [{ type: 'UV Warning', message: 'Very high UV index - use sun protection', severity: 'high' }]
      },
      hourly: [
        { time: 'Now', temperature: 82, condition: 'sunny' },
        { time: '1PM', temperature: 84, condition: 'sunny' },
        { time: '2PM', temperature: 86, condition: 'sunny' },
        { time: '3PM', temperature: 85, condition: 'sunny' },
        { time: '4PM', temperature: 83, condition: 'partly-cloudy' },
        { time: '5PM', temperature: 80, condition: 'partly-cloudy' },
        { time: '6PM', temperature: 78, condition: 'night-clear' },
        { time: '7PM', temperature: 76, condition: 'night-clear' },
        { time: '8PM', temperature: 74, condition: 'night-clear' },
        { time: '9PM', temperature: 73, condition: 'night-clear' }
      ],
      forecast: [
        { day: 'Mon', date: 'Jan 20', high: 84, low: 72, condition: 'sunny', precipitation: 0 },
        { day: 'Tue', date: 'Jan 21', high: 86, low: 74, condition: 'partly-cloudy', precipitation: 10 },
        { day: 'Wed', date: 'Jan 22', high: 80, low: 70, condition: 'stormy', precipitation: 85 },
        { day: 'Thu', date: 'Jan 23', high: 78, low: 68, condition: 'rainy', precipitation: 70 },
        { day: 'Fri', date: 'Jan 24', high: 82, low: 71, condition: 'sunny', precipitation: 5 }
      ]
    },
    'Sydney': {
      current: {
        location: 'Sydney, Australia',
        temperature: 65,
        feelsLike: 63,
        condition: 'cloudy',
        humidity: 55,
        windSpeed: 15,
        windDirection: 'SE',
        uvIndex: 4,
        sunrise: '5:58 AM',
        sunset: '8:05 PM'
      },
      hourly: [
        { time: 'Now', temperature: 65, condition: 'cloudy' },
        { time: '1PM', temperature: 67, condition: 'cloudy' },
        { time: '2PM', temperature: 68, condition: 'partly-cloudy' },
        { time: '3PM', temperature: 69, condition: 'partly-cloudy' },
        { time: '4PM', temperature: 68, condition: 'sunny' },
        { time: '5PM', temperature: 66, condition: 'sunny' },
        { time: '6PM', temperature: 64, condition: 'partly-cloudy' },
        { time: '7PM', temperature: 62, condition: 'night-cloudy' },
        { time: '8PM', temperature: 60, condition: 'night-clear' },
        { time: '9PM', temperature: 59, condition: 'night-clear' }
      ],
      forecast: [
        { day: 'Mon', date: 'Jan 20', high: 68, low: 54, condition: 'cloudy', precipitation: 25 },
        { day: 'Tue', date: 'Jan 21', high: 70, low: 56, condition: 'sunny', precipitation: 0 },
        { day: 'Wed', date: 'Jan 22', high: 72, low: 58, condition: 'sunny', precipitation: 0 },
        { day: 'Thu', date: 'Jan 23', high: 66, low: 52, condition: 'partly-cloudy', precipitation: 20 },
        { day: 'Fri', date: 'Jan 24', high: 64, low: 50, condition: 'rainy', precipitation: 60 }
      ]
    },
    'Moscow': {
      current: {
        location: 'Moscow, Russia',
        temperature: 28,
        feelsLike: 22,
        condition: 'snowy',
        humidity: 90,
        windSpeed: 20,
        windDirection: 'N',
        uvIndex: 1,
        sunrise: '8:45 AM',
        sunset: '4:15 PM',
        alerts: [{ type: 'Winter Storm', message: 'Heavy snowfall expected - travel not advised', severity: 'high' }]
      },
      hourly: [
        { time: 'Now', temperature: 28, condition: 'snowy' },
        { time: '1PM', temperature: 27, condition: 'snowy' },
        { time: '2PM', temperature: 26, condition: 'snowy' },
        { time: '3PM', temperature: 25, condition: 'snowy' },
        { time: '4PM', temperature: 24, condition: 'snowy' },
        { time: '5PM', temperature: 23, condition: 'night-cloudy' },
        { time: '6PM', temperature: 22, condition: 'night-cloudy' },
        { time: '7PM', temperature: 21, condition: 'night-clear' },
        { time: '8PM', temperature: 20, condition: 'night-clear' },
        { time: '9PM', temperature: 19, condition: 'night-clear' }
      ],
      forecast: [
        { day: 'Mon', date: 'Jan 20', high: 30, low: 18, condition: 'snowy', precipitation: 95 },
        { day: 'Tue', date: 'Jan 21', high: 25, low: 15, condition: 'snowy', precipitation: 80 },
        { day: 'Wed', date: 'Jan 22', high: 32, low: 20, condition: 'cloudy', precipitation: 30 },
        { day: 'Thu', date: 'Jan 23', high: 35, low: 24, condition: 'partly-cloudy', precipitation: 15 },
        { day: 'Fri', date: 'Jan 24', high: 38, low: 28, condition: 'sunny', precipitation: 0 }
      ]
    },
    'Dubai': {
      current: {
        location: 'Dubai, UAE',
        temperature: 105,
        feelsLike: 115,
        condition: 'sunny',
        humidity: 35,
        windSpeed: 10,
        windDirection: 'SW',
        uvIndex: 11,
        sunrise: '6:58 AM',
        sunset: '5:45 PM',
        alerts: [{ type: 'Extreme Heat', message: 'Dangerous heat levels - stay hydrated', severity: 'high' }]
      },
      hourly: [
        { time: 'Now', temperature: 105, condition: 'sunny' },
        { time: '1PM', temperature: 107, condition: 'sunny' },
        { time: '2PM', temperature: 109, condition: 'sunny' },
        { time: '3PM', temperature: 108, condition: 'sunny' },
        { time: '4PM', temperature: 106, condition: 'sunny' },
        { time: '5PM', temperature: 103, condition: 'sunny' },
        { time: '6PM', temperature: 99, condition: 'night-clear' },
        { time: '7PM', temperature: 95, condition: 'night-clear' },
        { time: '8PM', temperature: 92, condition: 'night-clear' },
        { time: '9PM', temperature: 90, condition: 'night-clear' }
      ],
      forecast: [
        { day: 'Mon', date: 'Jan 20', high: 107, low: 88, condition: 'sunny', precipitation: 0 },
        { day: 'Tue', date: 'Jan 21', high: 108, low: 90, condition: 'sunny', precipitation: 0 },
        { day: 'Wed', date: 'Jan 22', high: 104, low: 86, condition: 'sunny', precipitation: 0 },
        { day: 'Thu', date: 'Jan 23', high: 102, low: 84, condition: 'partly-cloudy', precipitation: 5 },
        { day: 'Fri', date: 'Jan 24', high: 106, low: 88, condition: 'sunny', precipitation: 0 }
      ]
    },
    'San Francisco': {
      current: {
        location: 'San Francisco, CA',
        temperature: 62,
        feelsLike: 60,
        condition: 'foggy',
        humidity: 78,
        windSpeed: 14,
        windDirection: 'W',
        uvIndex: 3,
        sunrise: '7:22 AM',
        sunset: '5:25 PM'
      },
      hourly: [
        { time: 'Now', temperature: 62, condition: 'foggy' },
        { time: '1PM', temperature: 63, condition: 'foggy' },
        { time: '2PM', temperature: 65, condition: 'partly-cloudy' },
        { time: '3PM', temperature: 66, condition: 'partly-cloudy' },
        { time: '4PM', temperature: 65, condition: 'cloudy' },
        { time: '5PM', temperature: 63, condition: 'foggy' },
        { time: '6PM', temperature: 61, condition: 'night-cloudy' },
        { time: '7PM', temperature: 59, condition: 'night-cloudy' },
        { time: '8PM', temperature: 58, condition: 'night-clear' },
        { time: '9PM', temperature: 57, condition: 'night-clear' }
      ],
      forecast: [
        { day: 'Mon', date: 'Jan 20', high: 64, low: 52, condition: 'foggy', precipitation: 10 },
        { day: 'Tue', date: 'Jan 21', high: 66, low: 54, condition: 'partly-cloudy', precipitation: 5 },
        { day: 'Wed', date: 'Jan 22', high: 68, low: 55, condition: 'sunny', precipitation: 0 },
        { day: 'Thu', date: 'Jan 23', high: 65, low: 53, condition: 'foggy', precipitation: 15 },
        { day: 'Fri', date: 'Jan 24', high: 67, low: 54, condition: 'partly-cloudy', precipitation: 10 }
      ]
    }
  };

  // State
  let locationInput = $state('New York');
  let selectedCity = $state('New York');
  let isLoading = $state(false);
  let useCelsius = $state(false);
  let selectedForecastDay = $state<number | null>(null);
  let showAlertBanner = $state(true);
  let mounted = $state(false);

  // Animated temperature value
  const animatedTemp = tweened(72, {
    duration: 800,
    easing: cubicOut
  });

  // Derived state
  const currentWeatherData = $derived(mockWeatherData[selectedCity] || mockWeatherData['New York']);
  const currentWeather = $derived(currentWeatherData.current);
  const forecast = $derived(currentWeatherData.forecast);
  const hourlyForecast = $derived(currentWeatherData.hourly);
  const hasAlerts = $derived(currentWeather.alerts && currentWeather.alerts.length > 0);

  // Update animated temperature when weather changes
  $effect(() => {
    const temp = useCelsius ? fahrenheitToCelsius(currentWeather.temperature) : currentWeather.temperature;
    animatedTemp.set(temp);
  });

  // Temperature conversion
  function fahrenheitToCelsius(f: number): number {
    return Math.round((f - 32) * 5 / 9);
  }

  function formatTemp(f: number): number {
    return useCelsius ? fahrenheitToCelsius(f) : f;
  }

  // Simulate loading when changing cities
  function handleLocationChange() {
    const trimmedInput = locationInput.trim();
    if (trimmedInput && trimmedInput !== selectedCity) {
      isLoading = true;
      showAlertBanner = true;
      const matchedCity = Object.keys(mockWeatherData).find(
        city => city.toLowerCase().includes(trimmedInput.toLowerCase())
      );

      setTimeout(() => {
        if (matchedCity) {
          selectedCity = matchedCity;
          locationInput = matchedCity;
        }
        isLoading = false;
      }, 600);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLocationChange();
    }
  }

  // Auto-refresh simulation
  let refreshInterval: ReturnType<typeof setInterval>;
  let lastUpdated = $state(new Date());

  onMount(() => {
    mounted = true;
    refreshInterval = setInterval(() => {
      lastUpdated = new Date();
    }, 60000);
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
  });

  const formattedUpdateTime = $derived(
    lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // UV Index level
  function getUVLevel(uv: number): { label: string; color: string } {
    if (uv <= 2) return { label: 'Low', color: '#22c55e' };
    if (uv <= 5) return { label: 'Moderate', color: '#eab308' };
    if (uv <= 7) return { label: 'High', color: '#f97316' };
    if (uv <= 10) return { label: 'Very High', color: '#ef4444' };
    return { label: 'Extreme', color: '#a855f7' };
  }

  const uvLevel = $derived(getUVLevel(currentWeather.uvIndex));

  // Weather emoji helper
  function getWeatherEmoji(condition: string): string {
    const emojis: Record<string, string> = {
      'sunny': '\u2600\uFE0F',
      'partly-cloudy': '\u26C5',
      'cloudy': '\u2601\uFE0F',
      'rainy': '\uD83C\uDF27\uFE0F',
      'stormy': '\u26C8\uFE0F',
      'snowy': '\u2744\uFE0F',
      'foggy': '\uD83C\uDF2B\uFE0F',
      'night-clear': '\uD83C\uDF19',
      'night-cloudy': '\uD83C\uDF19'
    };
    return emojis[condition] || '\u2600\uFE0F';
  }

  // Wind direction rotation helper
  function getWindRotation(direction: string): number {
    const rotations: Record<string, number> = {
      'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
      'S': 180, 'SW': 225, 'W': 270, 'NW': 315
    };
    return rotations[direction] || 0;
  }

  // Calculate sun progress (mock - based on current hour)
  const sunProgress = $derived(() => {
    const now = new Date();
    const hour = now.getHours();
    // Assume sunrise at 6, sunset at 18 for simplicity
    if (hour < 6 || hour > 18) return 0;
    return ((hour - 6) / 12) * 100;
  });
</script>

<div
  class="weather-widget"
  class:condition-sunny={currentWeather.condition === 'sunny'}
  class:condition-partly-cloudy={currentWeather.condition === 'partly-cloudy'}
  class:condition-cloudy={currentWeather.condition === 'cloudy'}
  class:condition-rainy={currentWeather.condition === 'rainy'}
  class:condition-stormy={currentWeather.condition === 'stormy'}
  class:condition-snowy={currentWeather.condition === 'snowy'}
  class:condition-foggy={currentWeather.condition === 'foggy'}
  class:condition-night-clear={currentWeather.condition === 'night-clear'}
  class:condition-night-cloudy={currentWeather.condition === 'night-cloudy'}
>
  <!-- Animated Background -->
  <div class="weather-bg">
    <div class="bg-gradient"></div>
    <div class="bg-overlay"></div>

    <!-- Weather Particles -->
    {#if currentWeather.condition === 'rainy' || currentWeather.condition === 'stormy'}
      <div class="rain-container">
        {#each Array(20) as _, i}
          <div class="raindrop" style="--delay: {Math.random() * 2}s; --x: {Math.random() * 100}%"></div>
        {/each}
      </div>
    {/if}

    {#if currentWeather.condition === 'snowy'}
      <div class="snow-container">
        {#each Array(30) as _, i}
          <div class="snowflake" style="--delay: {Math.random() * 5}s; --x: {Math.random() * 100}%; --size: {0.3 + Math.random() * 0.5}rem"></div>
        {/each}
      </div>
    {/if}

    {#if currentWeather.condition === 'sunny'}
      <div class="sun-rays"></div>
    {/if}

    {#if currentWeather.condition === 'foggy'}
      <div class="fog-layer fog-1"></div>
      <div class="fog-layer fog-2"></div>
    {/if}
  </div>

  <div class="weather-content">
    <!-- Weather Alert Banner -->
    {#if hasAlerts && showAlertBanner && mounted}
      <div
        class="alert-banner"
        class:severity-low={currentWeather.alerts?.[0]?.severity === 'low'}
        class:severity-medium={currentWeather.alerts?.[0]?.severity === 'medium'}
        class:severity-high={currentWeather.alerts?.[0]?.severity === 'high'}
        transition:slide={{ duration: 300 }}
      >
        <div class="alert-content">
          <span class="alert-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
            </svg>
          </span>
          <span class="alert-text">{currentWeather.alerts?.[0]?.type}: {currentWeather.alerts?.[0]?.message}</span>
        </div>
        <button class="alert-close" onclick={() => showAlertBanner = false}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    {/if}

    <!-- Location Bar -->
    <div class="location-bar">
      <div class="search-container">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search location..."
          bind:value={locationInput}
          onkeydown={handleKeydown}
          onblur={handleLocationChange}
          class="location-input"
        />
        {#if isLoading}
          <div class="search-spinner"></div>
        {/if}
      </div>
      <button
        class="unit-toggle"
        onclick={() => useCelsius = !useCelsius}
        title="Toggle temperature unit"
      >
        {useCelsius ? 'C' : 'F'}
      </button>
    </div>

    <!-- Current Weather Hero -->
    <div class="current-weather">
      <div class="weather-main">
        <div class="weather-icon-container">
          <!-- Animated Weather Icon -->
          {#if currentWeather.condition === 'sunny'}
            <div class="icon-sunny">
              <div class="sun-core"></div>
              <div class="sun-ray-container">
                {#each Array(8) as _, i}
                  <div class="sun-ray" style="--rotation: {i * 45}deg"></div>
                {/each}
              </div>
            </div>
          {:else if currentWeather.condition === 'partly-cloudy'}
            <div class="icon-partly-cloudy">
              <div class="small-sun">
                <div class="sun-core"></div>
              </div>
              <div class="cloud cloud-main">
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
              </div>
            </div>
          {:else if currentWeather.condition === 'cloudy'}
            <div class="icon-cloudy">
              <div class="cloud cloud-back"></div>
              <div class="cloud cloud-front">
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
              </div>
            </div>
          {:else if currentWeather.condition === 'rainy'}
            <div class="icon-rainy">
              <div class="cloud cloud-rain">
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
              </div>
              <div class="rain-drops">
                <div class="drop"></div>
                <div class="drop"></div>
                <div class="drop"></div>
              </div>
            </div>
          {:else if currentWeather.condition === 'stormy'}
            <div class="icon-stormy">
              <div class="cloud cloud-storm">
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
              </div>
              <div class="lightning">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            </div>
          {:else if currentWeather.condition === 'snowy'}
            <div class="icon-snowy">
              <div class="cloud cloud-snow">
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
              </div>
              <div class="snow-flakes">
                <div class="flake">*</div>
                <div class="flake">*</div>
                <div class="flake">*</div>
              </div>
            </div>
          {:else if currentWeather.condition === 'foggy'}
            <div class="icon-foggy">
              <div class="fog-line"></div>
              <div class="fog-line"></div>
              <div class="fog-line"></div>
            </div>
          {:else if currentWeather.condition === 'night-clear'}
            <div class="icon-night-clear">
              <div class="moon">
                <div class="moon-crater"></div>
                <div class="moon-crater"></div>
              </div>
              <div class="stars">
                <div class="star"></div>
                <div class="star"></div>
                <div class="star"></div>
              </div>
            </div>
          {:else if currentWeather.condition === 'night-cloudy'}
            <div class="icon-night-cloudy">
              <div class="moon small-moon"></div>
              <div class="cloud cloud-night">
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
                <div class="cloud-part"></div>
              </div>
            </div>
          {/if}
        </div>

        <div class="temperature-display">
          <span class="temp-value">{Math.round($animatedTemp)}</span>
          <span class="temp-unit">{useCelsius ? 'C' : 'F'}</span>
        </div>
      </div>

      <div class="weather-info">
        <div class="condition-text">{currentWeather.condition.replace(/-/g, ' ')}</div>
        <div class="location-name">{currentWeather.location}</div>
        <div class="feels-like">Feels like {formatTemp(currentWeather.feelsLike)}{useCelsius ? 'C' : 'F'}</div>
      </div>
    </div>

    <!-- Hourly Forecast Strip -->
    <div class="hourly-forecast">
      <div class="hourly-scroll">
        {#each hourlyForecast as hour, i}
          <div class="hourly-item" class:is-now={hour.time === 'Now'}>
            <span class="hourly-time">{hour.time}</span>
            <span class="hourly-icon">{getWeatherEmoji(hour.condition)}</span>
            <span class="hourly-temp">{formatTemp(hour.temperature)}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Weather Indicators -->
    <div class="weather-indicators">
      <div class="indicator">
        <div class="indicator-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10"/>
          </svg>
        </div>
        <div class="indicator-content">
          <span class="indicator-value">{currentWeather.humidity}%</span>
          <span class="indicator-label">Humidity</span>
        </div>
      </div>

      <div class="indicator">
        <div class="indicator-icon wind-icon" style="--wind-rotation: {getWindRotation(currentWeather.windDirection)}deg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L12 22M12 2L18 8M12 2L6 8"/>
          </svg>
        </div>
        <div class="indicator-content">
          <span class="indicator-value">{currentWeather.windSpeed} mph</span>
          <span class="indicator-label">{currentWeather.windDirection}</span>
        </div>
      </div>

      <div class="indicator">
        <div class="indicator-icon" style="color: {uvLevel.color}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="indicator-content">
          <span class="indicator-value" style="color: {uvLevel.color}">{currentWeather.uvIndex}</span>
          <span class="indicator-label">{uvLevel.label}</span>
        </div>
      </div>
    </div>

    <!-- Sunrise/Sunset -->
    <div class="sun-times">
      <div class="sun-progress-bar">
        <div class="sun-progress-fill" style="width: {sunProgress()}%"></div>
        <div class="sun-indicator" style="left: {sunProgress()}%">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
            <circle cx="12" cy="12" r="5"/>
          </svg>
        </div>
      </div>
      <div class="sun-time-labels">
        <div class="sun-time sunrise">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            <circle cx="12" cy="12" r="5"/>
          </svg>
          <span>{currentWeather.sunrise}</span>
        </div>
        <div class="sun-time sunset">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M12 10v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
            <circle cx="12" cy="14" r="5"/>
          </svg>
          <span>{currentWeather.sunset}</span>
        </div>
      </div>
    </div>

    <!-- 5-Day Forecast -->
    <div class="forecast-section">
      <h3 class="section-title">5-Day Forecast</h3>
      <div class="forecast-cards">
        {#each forecast as day, i}
          <button
            class="forecast-card"
            class:selected={selectedForecastDay === i}
            onclick={() => selectedForecastDay = selectedForecastDay === i ? null : i}
          >
            <span class="forecast-day">{day.day}</span>
            <span class="forecast-icon">{getWeatherEmoji(day.condition)}</span>
            <div class="forecast-temps">
              <span class="temp-high">{formatTemp(day.high)}</span>
              <span class="temp-low">{formatTemp(day.low)}</span>
            </div>
            {#if day.precipitation > 0}
              <span class="precipitation">
                <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                {day.precipitation}%
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Footer -->
    <div class="widget-footer">
      <span class="badge">rdtect Weather</span>
      <span class="update-time">Updated {formattedUpdateTime}</span>
    </div>
  </div>
</div>

<style>
  .weather-widget {
    position: relative;
    height: 100%;
    overflow: hidden;
    border-radius: var(--radius-lg);
    font-family: var(--desktop-font-sans);
  }

  /* Background Styles */
  .weather-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .bg-gradient {
    position: absolute;
    inset: 0;
    transition: background 1s ease-in-out;
  }

  .bg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 100%);
  }

  /* Condition-based backgrounds */
  .condition-sunny .bg-gradient {
    background: linear-gradient(135deg, #ff9500 0%, #ffcc00 30%, #87ceeb 70%, #4a90d9 100%);
    animation: sunnyShift 8s ease-in-out infinite;
  }

  .condition-partly-cloudy .bg-gradient {
    background: linear-gradient(135deg, #5b9bd5 0%, #87ceeb 40%, #d4e4ed 70%, #f5d76e 100%);
    animation: partlyCloudyShift 10s ease-in-out infinite;
  }

  .condition-cloudy .bg-gradient {
    background: linear-gradient(135deg, #4a5568 0%, #718096 40%, #a0aec0 70%, #cbd5e0 100%);
    animation: cloudyShift 12s ease-in-out infinite;
  }

  .condition-rainy .bg-gradient {
    background: linear-gradient(135deg, #1a365d 0%, #2c5282 30%, #4299e1 70%, #63b3ed 100%);
    animation: rainyShift 6s ease-in-out infinite;
  }

  .condition-stormy .bg-gradient {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 30%, #4a5568 60%, #1a202c 100%);
    animation: stormyShift 4s ease-in-out infinite;
  }

  .condition-snowy .bg-gradient {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 30%, #a0aec0 60%, #718096 100%);
    animation: snowyShift 15s ease-in-out infinite;
  }

  .condition-foggy .bg-gradient {
    background: linear-gradient(135deg, #718096 0%, #a0aec0 40%, #cbd5e0 70%, #e2e8f0 100%);
    animation: foggyShift 20s ease-in-out infinite;
  }

  .condition-night-clear .bg-gradient {
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    animation: nightShift 15s ease-in-out infinite;
  }

  .condition-night-cloudy .bg-gradient {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    animation: nightShift 15s ease-in-out infinite;
  }

  @keyframes sunnyShift {
    0%, 100% { filter: brightness(1) saturate(1); }
    50% { filter: brightness(1.05) saturate(1.1); }
  }

  @keyframes partlyCloudyShift {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(0.95); }
  }

  @keyframes cloudyShift {
    0%, 100% { filter: brightness(0.95); }
    50% { filter: brightness(1.05); }
  }

  @keyframes rainyShift {
    0%, 100% { filter: brightness(0.9); }
    50% { filter: brightness(1); }
  }

  @keyframes stormyShift {
    0%, 90%, 100% { filter: brightness(0.8); }
    92% { filter: brightness(1.5); }
    94% { filter: brightness(0.8); }
    96% { filter: brightness(1.3); }
  }

  @keyframes snowyShift {
    0%, 100% { filter: brightness(1.05) saturate(0.9); }
    50% { filter: brightness(1.1) saturate(0.95); }
  }

  @keyframes foggyShift {
    0%, 100% { opacity: 0.95; }
    50% { opacity: 1; }
  }

  @keyframes nightShift {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.1); }
  }

  /* Rain Particles */
  .rain-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .raindrop {
    position: absolute;
    top: -20px;
    left: var(--x);
    width: 2px;
    height: 15px;
    background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.6));
    border-radius: 0 0 2px 2px;
    animation: rain 0.8s linear infinite;
    animation-delay: var(--delay);
  }

  @keyframes rain {
    0% { transform: translateY(-20px); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
  }

  /* Snow Particles */
  .snow-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .snowflake {
    position: absolute;
    top: -20px;
    left: var(--x);
    width: var(--size);
    height: var(--size);
    background: rgba(255,255,255,0.9);
    border-radius: 50%;
    animation: snow 5s linear infinite;
    animation-delay: var(--delay);
    box-shadow: 0 0 5px rgba(255,255,255,0.5);
  }

  @keyframes snow {
    0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    100% { transform: translateY(100vh) translateX(30px) rotate(360deg); opacity: 0; }
  }

  /* Sun Rays Background */
  .sun-rays {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at center, rgba(255,200,0,0.15) 0%, transparent 50%);
    animation: sunRaysPulse 4s ease-in-out infinite;
  }

  @keyframes sunRaysPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
  }

  /* Fog Layers */
  .fog-layer {
    position: absolute;
    width: 200%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  }

  .fog-1 {
    top: 20%;
    animation: fog 15s linear infinite;
  }

  .fog-2 {
    top: 50%;
    animation: fog 20s linear infinite reverse;
    animation-delay: -5s;
  }

  @keyframes fog {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0%); }
  }

  /* Content */
  .weather-content {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    overflow-y: auto;
    gap: 0.5rem;
  }

  /* Alert Banner */
  .alert-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    backdrop-filter: blur(var(--glass-blur));
  }

  .severity-low {
    background: rgba(34, 197, 94, 0.3);
    border: 1px solid rgba(34, 197, 94, 0.5);
  }

  .severity-medium {
    background: rgba(234, 179, 8, 0.3);
    border: 1px solid rgba(234, 179, 8, 0.5);
  }

  .severity-high {
    background: rgba(239, 68, 68, 0.3);
    border: 1px solid rgba(239, 68, 68, 0.5);
  }

  .alert-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .alert-icon {
    flex-shrink: 0;
  }

  .alert-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .alert-close {
    background: rgba(255,255,255,0.2);
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: inherit;
    flex-shrink: 0;
  }

  .alert-close:hover {
    background: rgba(255,255,255,0.3);
  }

  /* Location Bar */
  .location-bar {
    display: flex;
    gap: 0.5rem;
  }

  .search-container {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    width: 14px;
    height: 14px;
    opacity: 0.7;
    pointer-events: none;
  }

  .location-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2rem;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-md);
    color: #fff;
    font-size: 0.8rem;
    backdrop-filter: blur(var(--glass-blur));
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .location-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .location-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .search-spinner {
    position: absolute;
    right: 0.75rem;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .unit-toggle {
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-md);
    color: #fff;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    min-width: 44px;
    min-height: 44px;
  }

  .unit-toggle:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  /* Current Weather Hero */
  .current-weather {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
  }

  .weather-main {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .weather-icon-container {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Weather Icon Animations */
  .icon-sunny {
    position: relative;
    width: 48px;
    height: 48px;
  }

  .sun-core {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(255, 200, 0, 0.6);
  }

  .sun-ray-container {
    position: absolute;
    inset: 0;
    animation: rotateSlow 20s linear infinite;
  }

  .sun-ray {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 12px;
    background: linear-gradient(to top, #ffd700, transparent);
    border-radius: 2px;
    transform-origin: center 20px;
    transform: translate(-50%, -100%) rotate(var(--rotation));
    animation: rayPulse 2s ease-in-out infinite;
  }

  @keyframes rotateSlow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes rayPulse {
    0%, 100% { opacity: 0.7; height: 10px; }
    50% { opacity: 1; height: 14px; }
  }

  /* Cloud styling */
  .cloud {
    position: relative;
  }

  .cloud-part {
    position: absolute;
    background: linear-gradient(to bottom, #fff 0%, #e0e0e0 100%);
    border-radius: 50%;
  }

  .cloud-main .cloud-part:nth-child(1) {
    width: 30px;
    height: 30px;
    bottom: 0;
    left: 0;
  }

  .cloud-main .cloud-part:nth-child(2) {
    width: 40px;
    height: 35px;
    bottom: 5px;
    left: 15px;
  }

  .cloud-main .cloud-part:nth-child(3) {
    width: 25px;
    height: 25px;
    bottom: 0;
    left: 40px;
  }

  .icon-partly-cloudy {
    position: relative;
    width: 60px;
    height: 48px;
  }

  .small-sun {
    position: absolute;
    top: 0;
    right: 5px;
    width: 24px;
    height: 24px;
  }

  .small-sun .sun-core {
    width: 18px;
    height: 18px;
    animation: sunGlow 3s ease-in-out infinite;
  }

  @keyframes sunGlow {
    0%, 100% { box-shadow: 0 0 15px rgba(255, 200, 0, 0.4); }
    50% { box-shadow: 0 0 25px rgba(255, 200, 0, 0.7); }
  }

  .icon-partly-cloudy .cloud-main {
    position: absolute;
    bottom: 0;
    left: 0;
    animation: floatCloud 4s ease-in-out infinite;
  }

  @keyframes floatCloud {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(5px); }
  }

  .icon-cloudy {
    position: relative;
    width: 60px;
    height: 48px;
  }

  .cloud-back {
    position: absolute;
    top: 0;
    left: 5px;
    width: 40px;
    height: 30px;
    background: rgba(255,255,255,0.5);
    border-radius: 20px;
    animation: floatCloud 6s ease-in-out infinite;
  }

  .cloud-front {
    position: absolute;
    bottom: 0;
    left: 0;
    animation: floatCloud 4s ease-in-out infinite reverse;
  }

  .icon-rainy {
    position: relative;
    width: 60px;
    height: 56px;
  }

  .cloud-rain {
    position: absolute;
    top: 0;
    left: 0;
  }

  .rain-drops {
    position: absolute;
    bottom: 0;
    left: 10px;
    display: flex;
    gap: 8px;
  }

  .drop {
    width: 3px;
    height: 10px;
    background: linear-gradient(to bottom, rgba(100,180,255,0.8), transparent);
    border-radius: 3px;
    animation: dropFall 0.6s ease-in infinite;
  }

  .drop:nth-child(2) { animation-delay: 0.2s; }
  .drop:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dropFall {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(15px); opacity: 0; }
  }

  .icon-stormy {
    position: relative;
    width: 60px;
    height: 56px;
  }

  .cloud-storm {
    position: absolute;
    top: 0;
    left: 0;
  }

  .cloud-storm .cloud-part {
    background: linear-gradient(to bottom, #6b7280 0%, #4b5563 100%);
  }

  .lightning {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    color: #fbbf24;
    animation: flash 2s ease-in-out infinite;
  }

  .lightning svg {
    width: 16px;
    height: 20px;
    filter: drop-shadow(0 0 5px #fbbf24);
  }

  @keyframes flash {
    0%, 90%, 100% { opacity: 0; }
    92%, 94% { opacity: 1; }
    93%, 95% { opacity: 0; }
    96% { opacity: 1; }
  }

  .icon-snowy {
    position: relative;
    width: 60px;
    height: 56px;
  }

  .cloud-snow {
    position: absolute;
    top: 0;
    left: 0;
  }

  .snow-flakes {
    position: absolute;
    bottom: 0;
    left: 10px;
    display: flex;
    gap: 10px;
    font-size: 12px;
    color: #fff;
  }

  .flake {
    animation: snowFall 1.5s ease-in-out infinite;
    text-shadow: 0 0 5px rgba(255,255,255,0.8);
  }

  .flake:nth-child(2) { animation-delay: 0.5s; }
  .flake:nth-child(3) { animation-delay: 1s; }

  @keyframes snowFall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(12px) rotate(180deg); opacity: 0; }
  }

  .icon-foggy {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 48px;
  }

  .fog-line {
    height: 4px;
    background: rgba(255,255,255,0.7);
    border-radius: 2px;
    animation: fogFloat 3s ease-in-out infinite;
  }

  .fog-line:nth-child(1) { width: 80%; animation-delay: 0s; }
  .fog-line:nth-child(2) { width: 100%; animation-delay: 0.5s; }
  .fog-line:nth-child(3) { width: 60%; animation-delay: 1s; }

  @keyframes fogFloat {
    0%, 100% { transform: translateX(0); opacity: 0.6; }
    50% { transform: translateX(5px); opacity: 1; }
  }

  .icon-night-clear {
    position: relative;
    width: 48px;
    height: 48px;
  }

  .moon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, #f5f5dc 0%, #daa520 100%);
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(245, 245, 220, 0.4), inset -5px -2px 0 rgba(0,0,0,0.1);
  }

  .moon-crater {
    position: absolute;
    background: rgba(0,0,0,0.1);
    border-radius: 50%;
  }

  .moon-crater:nth-child(1) {
    width: 6px;
    height: 6px;
    top: 8px;
    left: 8px;
  }

  .moon-crater:nth-child(2) {
    width: 4px;
    height: 4px;
    top: 16px;
    left: 16px;
  }

  .stars {
    position: absolute;
    inset: 0;
  }

  .star {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #fff;
    border-radius: 50%;
    animation: twinkle 2s ease-in-out infinite;
  }

  .star:nth-child(1) { top: 5px; left: 5px; animation-delay: 0s; }
  .star:nth-child(2) { top: 10px; right: 8px; animation-delay: 0.7s; }
  .star:nth-child(3) { bottom: 8px; left: 10px; animation-delay: 1.4s; }

  @keyframes twinkle {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
  }

  .icon-night-cloudy {
    position: relative;
    width: 60px;
    height: 48px;
  }

  .small-moon {
    position: absolute;
    top: 0;
    right: 5px;
    width: 18px;
    height: 18px;
  }

  .cloud-night .cloud-part {
    background: linear-gradient(to bottom, #4a5568 0%, #2d3748 100%);
  }

  .icon-night-cloudy .cloud-night {
    position: absolute;
    bottom: 0;
    left: 0;
    animation: floatCloud 5s ease-in-out infinite;
  }

  /* Temperature Display */
  .temperature-display {
    display: flex;
    align-items: flex-start;
  }

  .temp-value {
    font-size: 3rem;
    font-weight: 200;
    line-height: 1;
    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.8) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .temp-unit {
    font-size: 1.25rem;
    font-weight: 300;
    opacity: 0.8;
    margin-top: 0.25rem;
  }

  .temp-unit::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border: 2px solid currentColor;
    border-radius: 50%;
    margin-right: 2px;
  }

  .weather-info {
    flex: 1;
  }

  .condition-text {
    font-size: 1rem;
    font-weight: 500;
    text-transform: capitalize;
    margin-bottom: 0.15rem;
  }

  .location-name {
    font-size: 0.8rem;
    opacity: 0.9;
  }

  .feels-like {
    font-size: 0.7rem;
    opacity: 0.7;
    margin-top: 0.15rem;
  }

  /* Hourly Forecast */
  .hourly-forecast {
    background: rgba(0, 0, 0, 0.15);
    border-radius: var(--radius-lg);
    padding: 0.5rem;
    backdrop-filter: blur(var(--glass-blur));
  }

  .hourly-scroll {
    display: flex;
    gap: 0.25rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
  }

  .hourly-scroll::-webkit-scrollbar {
    height: 4px;
  }

  .hourly-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .hourly-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 2px;
  }

  .hourly-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.35rem 0.5rem;
    min-width: 45px;
    border-radius: var(--radius-md);
    transition: background var(--transition-normal) var(--transition-easing);
  }

  .hourly-item:hover {
    background: rgba(255,255,255,0.1);
  }

  .hourly-item.is-now {
    background: rgba(255,255,255,0.2);
  }

  .hourly-time {
    font-size: 0.65rem;
    opacity: 0.8;
  }

  .hourly-icon {
    font-size: 1rem;
  }

  .hourly-temp {
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Weather Indicators */
  .weather-indicators {
    display: flex;
    gap: 0.5rem;
  }

  .indicator {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.15);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(var(--glass-blur));
  }

  .indicator-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
  }

  .indicator-icon svg {
    width: 18px;
    height: 18px;
  }

  .wind-icon {
    transform: rotate(var(--wind-rotation));
    transition: transform 0.5s ease-out;
  }

  .indicator-content {
    display: flex;
    flex-direction: column;
  }

  .indicator-value {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .indicator-label {
    font-size: 0.6rem;
    opacity: 0.7;
    text-transform: uppercase;
  }

  /* Sun Times */
  .sun-times {
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.15);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(var(--glass-blur));
  }

  .sun-progress-bar {
    position: relative;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    margin-bottom: 0.5rem;
  }

  .sun-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
    border-radius: 2px;
    transition: width 0.3s ease-out;
  }

  .sun-indicator {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    color: #fbbf24;
    filter: drop-shadow(0 0 3px rgba(251, 191, 36, 0.5));
  }

  .sun-time-labels {
    display: flex;
    justify-content: space-between;
  }

  .sun-time {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.65rem;
    opacity: 0.8;
  }

  /* Forecast Section */
  .forecast-section {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .section-title {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.7;
    margin-bottom: 0.4rem;
    font-weight: 500;
  }

  .forecast-cards {
    display: flex;
    gap: 0.3rem;
    flex: 1;
  }

  .forecast-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    padding: 0.4rem 0.2rem;
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    backdrop-filter: blur(var(--glass-blur));
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
    color: inherit;
    font-family: inherit;
    text-shadow: inherit;
  }

  .forecast-card:hover {
    background: rgba(0, 0, 0, 0.25);
    transform: translateY(-2px);
  }

  .forecast-card.selected {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .forecast-day {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .forecast-icon {
    font-size: 1.2rem;
  }

  .forecast-temps {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    font-size: 0.7rem;
  }

  .temp-high {
    font-weight: 600;
  }

  .temp-low {
    opacity: 0.6;
  }

  .precipitation {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.6rem;
    opacity: 0.8;
    color: #60a5fa;
  }

  /* Footer */
  .widget-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.4rem;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    margin-top: auto;
  }

  .badge {
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    opacity: 0.6;
    font-weight: 500;
  }

  .update-time {
    font-size: 0.55rem;
    opacity: 0.6;
  }

  /* Responsive adjustments */
  @media (max-height: 500px) {
    .weather-content {
      padding: 0.5rem;
      gap: 0.35rem;
    }

    .current-weather {
      padding: 0.25rem 0;
    }

    .weather-icon-container {
      width: 48px;
      height: 48px;
    }

    .temp-value {
      font-size: 2.5rem;
    }
  }
</style>
