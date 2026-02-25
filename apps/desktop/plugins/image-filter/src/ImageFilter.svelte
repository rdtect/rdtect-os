<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  interface Props {
    windowId?: string;
  }

  let { windowId }: Props = $props();

  // Filter engine state
  let filtersReady = $state(false);
  let filters = $state<ImageFilters | null>(null);

  // Interface for filter functions
  interface ImageFilters {
    applyGrayscale: (data: Uint8ClampedArray) => Uint8ClampedArray;
    applyBrightness: (
      data: Uint8ClampedArray,
      value: number,
    ) => Uint8ClampedArray;
    applyContrast: (
      data: Uint8ClampedArray,
      value: number,
    ) => Uint8ClampedArray;
    applyInvert: (data: Uint8ClampedArray) => Uint8ClampedArray;
    applySepia: (data: Uint8ClampedArray) => Uint8ClampedArray;
    applySaturation: (
      data: Uint8ClampedArray,
      value: number,
    ) => Uint8ClampedArray;
    applyBlur: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      radius: number,
    ) => Uint8ClampedArray;
    applySharpen: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      amount: number,
    ) => Uint8ClampedArray;
    applyHueRotate: (
      data: Uint8ClampedArray,
      degrees: number,
    ) => Uint8ClampedArray;
    applyThreshold: (
      data: Uint8ClampedArray,
      threshold: number,
    ) => Uint8ClampedArray;
    applyPosterize: (
      data: Uint8ClampedArray,
      levels: number,
    ) => Uint8ClampedArray;
    getVersion: () => string;
  }

  // Canvas state
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let originalImageData: ImageData | null = null;
  let hasImage = $state(false);
  let isProcessing = $state(false);

  // Filter state
  let currentFilter = $state("none");
  let brightness = $state(0);
  let contrast = $state(0);
  let saturation = $state(0);
  let blurRadius = $state(2);
  let sharpenAmount = $state(50);
  let hueRotation = $state(0);
  let threshold = $state(128);
  let posterizeLevels = $state(4);

  // Filter definitions
  const basicFilters = [
    { id: "none", name: "Original" },
    { id: "grayscale", name: "Grayscale" },
    { id: "sepia", name: "Sepia" },
    { id: "invert", name: "Invert" },
  ];

  const adjustmentFilters = [
    {
      id: "brightness",
      name: "Brightness",
      min: -100,
      max: 100,
      value: () => brightness,
      set: (v: number) => (brightness = v),
    },
    {
      id: "contrast",
      name: "Contrast",
      min: -100,
      max: 100,
      value: () => contrast,
      set: (v: number) => (contrast = v),
    },
    {
      id: "saturation",
      name: "Saturation",
      min: -100,
      max: 100,
      value: () => saturation,
      set: (v: number) => (saturation = v),
    },
    {
      id: "hueRotate",
      name: "Hue Rotate",
      min: 0,
      max: 360,
      value: () => hueRotation,
      set: (v: number) => (hueRotation = v),
    },
  ];

  const effectFilters = [
    {
      id: "blur",
      name: "Blur",
      min: 1,
      max: 10,
      value: () => blurRadius,
      set: (v: number) => (blurRadius = v),
    },
    {
      id: "sharpen",
      name: "Sharpen",
      min: 0,
      max: 100,
      value: () => sharpenAmount,
      set: (v: number) => (sharpenAmount = v),
    },
    {
      id: "threshold",
      name: "Threshold",
      min: 0,
      max: 255,
      value: () => threshold,
      set: (v: number) => (threshold = v),
    },
    {
      id: "posterize",
      name: "Posterize",
      min: 2,
      max: 16,
      value: () => posterizeLevels,
      set: (v: number) => (posterizeLevels = v),
    },
  ];

  // JavaScript-based filter implementations
  const jsFilters: ImageFilters = {
    applyGrayscale: (data: Uint8ClampedArray) => {
      const result = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        result[i] = result[i + 1] = result[i + 2] = gray;
        result[i + 3] = data[i + 3];
      }
      return result;
    },
    applyBrightness: (data: Uint8ClampedArray, value: number) => {
      const result = new Uint8ClampedArray(data.length);
      const factor = value * 2.55;
      for (let i = 0; i < data.length; i += 4) {
        result[i] = Math.min(255, Math.max(0, data[i] + factor));
        result[i + 1] = Math.min(255, Math.max(0, data[i + 1] + factor));
        result[i + 2] = Math.min(255, Math.max(0, data[i + 2] + factor));
        result[i + 3] = data[i + 3];
      }
      return result;
    },
    applyContrast: (data: Uint8ClampedArray, value: number) => {
      const result = new Uint8ClampedArray(data.length);
      const factor = (259 * (value + 255)) / (255 * (259 - value));
      for (let i = 0; i < data.length; i += 4) {
        result[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
        result[i + 1] = Math.min(
          255,
          Math.max(0, factor * (data[i + 1] - 128) + 128),
        );
        result[i + 2] = Math.min(
          255,
          Math.max(0, factor * (data[i + 2] - 128) + 128),
        );
        result[i + 3] = data[i + 3];
      }
      return result;
    },
    applyInvert: (data: Uint8ClampedArray) => {
      const result = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 4) {
        result[i] = 255 - data[i];
        result[i + 1] = 255 - data[i + 1];
        result[i + 2] = 255 - data[i + 2];
        result[i + 3] = data[i + 3];
      }
      return result;
    },
    applySepia: (data: Uint8ClampedArray) => {
      const result = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        result[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        result[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        result[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        result[i + 3] = data[i + 3];
      }
      return result;
    },
    applySaturation: (data: Uint8ClampedArray, value: number) => {
      const result = new Uint8ClampedArray(data.length);
      const factor = (value + 100) / 100;
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        result[i] = Math.min(
          255,
          Math.max(0, gray + factor * (data[i] - gray)),
        );
        result[i + 1] = Math.min(
          255,
          Math.max(0, gray + factor * (data[i + 1] - gray)),
        );
        result[i + 2] = Math.min(
          255,
          Math.max(0, gray + factor * (data[i + 2] - gray)),
        );
        result[i + 3] = data[i + 3];
      }
      return result;
    },
    applyBlur: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      radius: number,
    ) => {
      // Simple box blur
      const result = new Uint8ClampedArray(data.length);
      const size = radius * 2 + 1;
      const divisor = size * size;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0,
            g = 0,
            b = 0,
            count = 0;
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const ny = Math.min(height - 1, Math.max(0, y + ky));
              const nx = Math.min(width - 1, Math.max(0, x + kx));
              const idx = (ny * width + nx) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              count++;
            }
          }
          const idx = (y * width + x) * 4;
          result[idx] = r / count;
          result[idx + 1] = g / count;
          result[idx + 2] = b / count;
          result[idx + 3] = data[idx + 3];
        }
      }
      return result;
    },
    applySharpen: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      amount: number,
    ) => {
      const result = new Uint8ClampedArray(data.length);
      const factor = amount / 50;
      const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            const idx = (y * width + x) * 4 + c;
            const blended = data[idx] + (sum - data[idx]) * factor;
            result[idx] = Math.min(255, Math.max(0, blended));
          }
          result[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
        }
      }
      return result;
    },
    applyHueRotate: (data: Uint8ClampedArray, degrees: number) => {
      const result = new Uint8ClampedArray(data.length);
      const angle = (degrees * Math.PI) / 180;
      const cos = Math.cos(angle),
        sin = Math.sin(angle);
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        result[i] = Math.min(
          255,
          Math.max(
            0,
            r * (0.213 + cos * 0.787 - sin * 0.213) +
              g * (0.715 - cos * 0.715 - sin * 0.715) +
              b * (0.072 - cos * 0.072 + sin * 0.928),
          ),
        );
        result[i + 1] = Math.min(
          255,
          Math.max(
            0,
            r * (0.213 - cos * 0.213 + sin * 0.143) +
              g * (0.715 + cos * 0.285 + sin * 0.14) +
              b * (0.072 - cos * 0.072 - sin * 0.283),
          ),
        );
        result[i + 2] = Math.min(
          255,
          Math.max(
            0,
            r * (0.213 - cos * 0.213 - sin * 0.787) +
              g * (0.715 - cos * 0.715 + sin * 0.715) +
              b * (0.072 + cos * 0.928 + sin * 0.072),
          ),
        );
        result[i + 3] = data[i + 3];
      }
      return result;
    },
    applyThreshold: (data: Uint8ClampedArray, threshold: number) => {
      const result = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const val = gray >= threshold ? 255 : 0;
        result[i] = result[i + 1] = result[i + 2] = val;
        result[i + 3] = data[i + 3];
      }
      return result;
    },
    applyPosterize: (data: Uint8ClampedArray, levels: number) => {
      const result = new Uint8ClampedArray(data.length);
      const step = 255 / (levels - 1);
      for (let i = 0; i < data.length; i += 4) {
        result[i] = Math.round(Math.round(data[i] / step) * step);
        result[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
        result[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
        result[i + 3] = data[i + 3];
      }
      return result;
    },
    getVersion: () => "JS Canvas v1.0",
  };

  // Initialize filter engine
  function initFilters() {
    filters = jsFilters;
    filtersReady = true;
  }

  function loadImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize canvas to fit image (with max dimensions)
        const maxWidth = 540;
        const maxHeight = 320;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        originalImageData = ctx?.getImageData(0, 0, width, height) || null;
        hasImage = true;
        currentFilter = "none";
        resetSliders();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function resetSliders() {
    brightness = 0;
    contrast = 0;
    saturation = 0;
    blurRadius = 2;
    sharpenAmount = 50;
    hueRotation = 0;
    threshold = 128;
    posterizeLevels = 4;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith("image/")) {
      loadImage(file);
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      loadImage(file);
    }
  }

  function applyFilter(filterId: string) {
    if (!ctx || !originalImageData || !filters) return;
    if (isProcessing) return;

    isProcessing = true;
    currentFilter = filterId;

    // Use requestAnimationFrame to allow UI to update
    requestAnimationFrame(() => {
      try {
        const width = originalImageData!.width;
        const height = originalImageData!.height;
        let resultData: Uint8ClampedArray;

        switch (filterId) {
          case "grayscale":
            resultData = filters!.applyGrayscale(originalImageData!.data);
            break;
          case "sepia":
            resultData = filters!.applySepia(originalImageData!.data);
            break;
          case "invert":
            resultData = filters!.applyInvert(originalImageData!.data);
            break;
          case "brightness":
            resultData = filters!.applyBrightness(
              originalImageData!.data,
              brightness,
            );
            break;
          case "contrast":
            resultData = filters!.applyContrast(
              originalImageData!.data,
              contrast,
            );
            break;
          case "saturation":
            resultData = filters!.applySaturation(
              originalImageData!.data,
              saturation,
            );
            break;
          case "blur":
            resultData = filters!.applyBlur(
              originalImageData!.data,
              width,
              height,
              blurRadius,
            );
            break;
          case "sharpen":
            resultData = filters!.applySharpen(
              originalImageData!.data,
              width,
              height,
              sharpenAmount,
            );
            break;
          case "hueRotate":
            resultData = filters!.applyHueRotate(
              originalImageData!.data,
              hueRotation,
            );
            break;
          case "threshold":
            resultData = filters!.applyThreshold(
              originalImageData!.data,
              threshold,
            );
            break;
          case "posterize":
            resultData = filters!.applyPosterize(
              originalImageData!.data,
              posterizeLevels,
            );
            break;
          case "none":
          default:
            resultData = originalImageData!.data;
            break;
        }

        // Create new ImageData and put it on canvas
        const newImageData = new ImageData(
          new Uint8ClampedArray(resultData),
          width,
          height,
        );
        ctx!.putImageData(newImageData, 0, 0);
      } catch (error) {
        console.error("Filter error:", error);
      } finally {
        isProcessing = false;
      }
    });
  }

  // Reactive filter application for sliders
  function handleSliderChange(filterId: string) {
    if (currentFilter === filterId) {
      applyFilter(filterId);
    }
  }

  function downloadImage() {
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `filtered-image-${currentFilter}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function resetImage() {
    if (!ctx || !originalImageData) return;
    ctx.putImageData(originalImageData, 0, 0);
    currentFilter = "none";
    resetSliders();
  }

  onMount(() => {
    ctx = canvas.getContext("2d");
    initFilters();
  });

  onDestroy(() => {
  });
</script>

<div class="filter-container">
  <div class="header">
    <h3>Image Filter</h3>
    <div class="header-actions">
      {#if filtersReady}
        <span class="status ready">Ready</span>
      {:else}
        <span class="status loading">Loading...</span>
      {/if}
      <input
        type="file"
        accept="image/*"
        id="file-input-{windowId}"
        onchange={handleFileSelect}
        hidden
      />
      <label for="file-input-{windowId}" class="upload-btn">Upload Image</label>
    </div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="canvas-area"
    ondrop={handleDrop}
    ondragover={handleDragOver}
    class:has-image={hasImage}
  >
    <canvas bind:this={canvas} width="540" height="320"></canvas>

    {#if !hasImage}
      <div class="drop-zone">
        <div class="drop-icon">+</div>
        <p>Drop an image here</p>
        <p class="hint">or click "Upload Image" above</p>
      </div>
    {/if}

    {#if isProcessing}
      <div class="processing-overlay">
        <div class="spinner"></div>
        <p>Processing...</p>
      </div>
    {/if}
  </div>

  {#if hasImage && filtersReady}
    <div class="controls">
      <!-- Basic Filters -->
      <div class="filter-section">
        <h4>Basic Filters</h4>
        <div class="filter-buttons">
          {#each basicFilters as filter}
            <button
              class="filter-btn"
              class:active={currentFilter === filter.id}
              onclick={() => applyFilter(filter.id)}
              disabled={!hasImage || isProcessing}
            >
              {filter.name}
            </button>
          {/each}
        </div>
      </div>

      <!-- Adjustment Filters -->
      <div class="filter-section">
        <h4>Adjustments</h4>
        {#each adjustmentFilters as filter}
          <div class="slider-control">
            <div class="slider-header">
              <label for="slider-{filter.id}">{filter.name}</label>
              <span class="slider-value">{filter.value()}</span>
            </div>
            <div class="slider-row">
              <input
                type="range"
                id="slider-{filter.id}"
                min={filter.min}
                max={filter.max}
                value={filter.value()}
                oninput={(e) => {
                  filter.set(parseInt((e.target as HTMLInputElement).value));
                  currentFilter = filter.id;
                  handleSliderChange(filter.id);
                }}
                disabled={isProcessing}
              />
              <button
                class="apply-btn"
                class:active={currentFilter === filter.id}
                onclick={() => applyFilter(filter.id)}
                disabled={isProcessing}
              >
                Apply
              </button>
            </div>
          </div>
        {/each}
      </div>

      <!-- Effect Filters -->
      <div class="filter-section">
        <h4>Effects</h4>
        {#each effectFilters as filter}
          <div class="slider-control">
            <div class="slider-header">
              <label for="slider-{filter.id}">{filter.name}</label>
              <span class="slider-value">{filter.value()}</span>
            </div>
            <div class="slider-row">
              <input
                type="range"
                id="slider-{filter.id}"
                min={filter.min}
                max={filter.max}
                value={filter.value()}
                oninput={(e) => {
                  filter.set(parseInt((e.target as HTMLInputElement).value));
                  currentFilter = filter.id;
                  handleSliderChange(filter.id);
                }}
                disabled={isProcessing}
              />
              <button
                class="apply-btn"
                class:active={currentFilter === filter.id}
                onclick={() => applyFilter(filter.id)}
                disabled={isProcessing}
              >
                Apply
              </button>
            </div>
          </div>
        {/each}
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="reset-btn" onclick={resetImage} disabled={isProcessing}>
          Reset
        </button>
        <button
          class="download-btn"
          onclick={downloadImage}
          disabled={isProcessing}
        >
          Download
        </button>
      </div>
    </div>
  {:else if hasImage}
    <div class="loading-message">
      <div class="spinner"></div>
      <p>Loading filters...</p>
    </div>
  {/if}

  <div class="badge">Canvas Filter Plugin</div>
</div>

<style>
  .filter-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    font-family: var(--desktop-font-sans);
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #334155;
    background: #1e293b;
    flex-shrink: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  h3 {
    margin: 0;
    font-size: 14px;
    color: #f1f5f9;
    font-weight: 600;
  }

  h4 {
    margin: 0 0 8px 0;
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status {
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
  }

  .status.ready {
    background: #166534;
    color: #86efac;
  }

  .status.loading {
    background: #854d0e;
    color: #fde047;
  }

  .status.error {
    background: #991b1b;
    color: #fca5a5;
    cursor: help;
  }

  .upload-btn {
    background: #6366f1;
    color: white;
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--text-sm);
    font-weight: 500;
    transition: background var(--transition-normal) var(--transition-easing);
  }

  .upload-btn:hover {
    background: #4f46e5;
  }

  .canvas-area {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    position: relative;
    background: #1e293b;
    margin: 12px;
    border-radius: var(--radius-md);
    border: 2px dashed #334155;
    min-height: 200px;
    max-height: 340px;
  }

  .canvas-area.has-image {
    border-style: solid;
    border-color: #334155;
  }

  canvas {
    max-width: 100%;
    max-height: 100%;
    border-radius: 4px;
    display: block;
  }

  .drop-zone {
    position: absolute;
    text-align: center;
    color: #64748b;
  }

  .drop-icon {
    font-size: 48px;
    color: #64748b;
    margin-bottom: 8px;
  }

  .drop-zone p {
    margin: 8px 0;
  }

  .hint {
    font-size: 11px;
    color: #64748b;
  }

  .processing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    color: #94a3b8;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #334155;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 8px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .controls {
    flex: 1;
    overflow-y: auto;
    padding: 0 12px 12px;
  }

  .filter-section {
    margin-bottom: 16px;
    padding: 12px;
    background: #1e293b;
    border-radius: var(--radius-md);
  }

  .filter-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .filter-btn {
    background: #334155;
    border: none;
    color: #94a3b8;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 11px;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .filter-btn:hover:not(:disabled) {
    background: #475569;
    color: #f1f5f9;
  }

  .filter-btn.active {
    background: #6366f1;
    color: white;
  }

  .filter-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .slider-control {
    margin-bottom: 12px;
  }

  .slider-control:last-child {
    margin-bottom: 0;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .slider-header label {
    font-size: 11px;
    color: #94a3b8;
  }

  .slider-value {
    font-size: 11px;
    color: #6366f1;
    font-weight: 600;
    min-width: 32px;
    text-align: right;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  input[type="range"] {
    flex: 1;
    height: 4px;
    background: #334155;
    border-radius: 2px;
    appearance: none;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    background: #6366f1;
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: #6366f1;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }

  input[type="range"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .apply-btn {
    background: #334155;
    border: none;
    color: #94a3b8;
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 10px;
    transition: all var(--transition-normal) var(--transition-easing);
    flex-shrink: 0;
  }

  .apply-btn:hover:not(:disabled) {
    background: #475569;
    color: #f1f5f9;
  }

  .apply-btn.active {
    background: #6366f1;
    color: white;
  }

  .apply-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    padding: 12px;
    background: #1e293b;
    border-radius: var(--radius-md);
  }

  .reset-btn,
  .download-btn {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: 600;
    font-size: 12px;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .reset-btn {
    background: #334155;
    color: #f1f5f9;
  }

  .reset-btn:hover:not(:disabled) {
    background: #475569;
  }

  .download-btn {
    background: #22c55e;
    color: white;
  }

  .download-btn:hover:not(:disabled) {
    background: #16a34a;
  }

  .reset-btn:disabled,
  .download-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message,
  .loading-message {
    padding: 20px;
    text-align: center;
    color: #94a3b8;
  }

  .error-message p {
    margin: 8px 0;
  }

  .error-detail {
    color: #f87171;
    font-size: 12px;
  }

  .badge {
    text-align: center;
    padding: 8px;
    font-size: 10px;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    flex-shrink: 0;
    border-top: 1px solid #334155;
  }
</style>
