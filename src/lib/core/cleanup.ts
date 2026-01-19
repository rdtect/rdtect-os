/**
 * Cleanup Utility - Resource Management Helpers
 *
 * Provides patterns for managing disposable resources like:
 * - Event listeners
 * - Intervals/Timeouts
 * - AbortControllers for fetch requests
 * - Subscriptions
 *
 * Use with Svelte 5's $effect cleanup or onDestroy lifecycle.
 */

/**
 * A disposable resource that can be cleaned up
 */
export interface Disposable {
  dispose: () => void;
}

/**
 * Registry for managing multiple disposable resources
 * Useful when a component needs to track many cleanup tasks
 *
 * @example
 * ```ts
 * const cleanup = new DisposableRegistry();
 *
 * // In onMount or $effect
 * cleanup.addInterval(setInterval(...));
 * cleanup.addTimeout(setTimeout(...));
 * cleanup.addListener(window, 'resize', handler);
 *
 * // In onDestroy or $effect cleanup
 * cleanup.disposeAll();
 * ```
 */
export class DisposableRegistry {
  private disposables: Disposable[] = [];

  /**
   * Add a generic disposable
   */
  add(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  /**
   * Register an interval for automatic cleanup
   */
  addInterval(intervalId: ReturnType<typeof setInterval>): void {
    this.disposables.push({
      dispose: () => clearInterval(intervalId),
    });
  }

  /**
   * Register a timeout for automatic cleanup
   */
  addTimeout(timeoutId: ReturnType<typeof setTimeout>): void {
    this.disposables.push({
      dispose: () => clearTimeout(timeoutId),
    });
  }

  /**
   * Register an event listener for automatic cleanup
   */
  addListener<K extends keyof WindowEventMap>(
    target: Window,
    type: K,
    listener: (ev: WindowEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addListener<K extends keyof DocumentEventMap>(
    target: Document,
    type: K,
    listener: (ev: DocumentEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addListener<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    listener: (ev: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this.disposables.push({
      dispose: () => target.removeEventListener(type, listener, options),
    });
  }

  /**
   * Register an AbortController for automatic abort
   */
  addAbortController(controller: AbortController): void {
    this.disposables.push({
      dispose: () => controller.abort(),
    });
  }

  /**
   * Register an animation frame for automatic cancellation
   */
  addAnimationFrame(frameId: number): void {
    this.disposables.push({
      dispose: () => cancelAnimationFrame(frameId),
    });
  }

  /**
   * Register a WebSocket for automatic close
   */
  addWebSocket(socket: WebSocket): void {
    this.disposables.push({
      dispose: () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      },
    });
  }

  /**
   * Register a PerformanceObserver for automatic disconnect
   */
  addPerformanceObserver(observer: PerformanceObserver): void {
    this.disposables.push({
      dispose: () => observer.disconnect(),
    });
  }

  /**
   * Register a MutationObserver for automatic disconnect
   */
  addMutationObserver(observer: MutationObserver): void {
    this.disposables.push({
      dispose: () => observer.disconnect(),
    });
  }

  /**
   * Register a ResizeObserver for automatic disconnect
   */
  addResizeObserver(observer: ResizeObserver): void {
    this.disposables.push({
      dispose: () => observer.disconnect(),
    });
  }

  /**
   * Register an IntersectionObserver for automatic disconnect
   */
  addIntersectionObserver(observer: IntersectionObserver): void {
    this.disposables.push({
      dispose: () => observer.disconnect(),
    });
  }

  /**
   * Register a custom cleanup function
   */
  addCleanup(cleanup: () => void): void {
    this.disposables.push({ dispose: cleanup });
  }

  /**
   * Dispose all registered resources
   */
  disposeAll(): void {
    // Dispose in reverse order (LIFO)
    while (this.disposables.length > 0) {
      const disposable = this.disposables.pop();
      try {
        disposable?.dispose();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  }

  /**
   * Get the number of registered disposables
   */
  get size(): number {
    return this.disposables.length;
  }
}

/**
 * Create a managed interval that can be easily cleaned up
 *
 * @example
 * ```ts
 * const stopInterval = createManagedInterval(() => {
 *   updateTime();
 * }, 1000);
 *
 * // Later, to stop:
 * stopInterval();
 * ```
 */
export function createManagedInterval(
  callback: () => void,
  ms: number
): () => void {
  const id = setInterval(callback, ms);
  return () => clearInterval(id);
}

/**
 * Create a managed timeout that can be easily cancelled
 */
export function createManagedTimeout(
  callback: () => void,
  ms: number
): () => void {
  const id = setTimeout(callback, ms);
  return () => clearTimeout(id);
}

/**
 * Create a managed animation frame loop with cleanup
 *
 * @example
 * ```ts
 * const stopAnimation = createManagedAnimationLoop((timestamp) => {
 *   render(timestamp);
 * });
 *
 * // Later, to stop:
 * stopAnimation();
 * ```
 */
export function createManagedAnimationLoop(
  callback: (timestamp: DOMHighResTimeStamp) => void
): () => void {
  let frameId: number;
  let running = true;

  function loop(timestamp: DOMHighResTimeStamp) {
    if (!running) return;
    callback(timestamp);
    frameId = requestAnimationFrame(loop);
  }

  frameId = requestAnimationFrame(loop);

  return () => {
    running = false;
    cancelAnimationFrame(frameId);
  };
}

/**
 * Create a managed event listener that returns an unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = createManagedListener(window, 'resize', handleResize);
 *
 * // Later, to remove:
 * unsubscribe();
 * ```
 */
export function createManagedListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (ev: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function createManagedListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (ev: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function createManagedListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (ev: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void;
export function createManagedListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): () => void {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
}

/**
 * Create an AbortController that will be automatically aborted after timeout
 */
export function createTimeoutAbortController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Override abort to also clear the timeout
  const originalAbort = controller.abort.bind(controller);
  controller.abort = () => {
    clearTimeout(timeoutId);
    originalAbort();
  };

  return controller;
}

/**
 * Safe fetch wrapper with automatic AbortController management
 *
 * @example
 * ```ts
 * const { data, cleanup } = await safeFetch('/api/data', { timeout: 5000 });
 *
 * // In cleanup:
 * cleanup();
 * ```
 */
export async function safeFetch<T>(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<{ data: T; response: Response; cleanup: () => void }> {
  const { timeout = 30000, ...fetchOptions } = options;
  const controller = createTimeoutAbortController(timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    const data = await response.json();

    return {
      data,
      response,
      cleanup: () => controller.abort(),
    };
  } catch (error) {
    controller.abort();
    throw error;
  }
}

/**
 * Hook factory for Svelte 5 $effect cleanup pattern
 *
 * @example
 * ```ts
 * // In your component
 * $effect(() => {
 *   const cleanup = createCleanup();
 *
 *   cleanup.addInterval(setInterval(...));
 *   cleanup.addListener(window, 'resize', handler);
 *
 *   return () => cleanup.disposeAll();
 * });
 * ```
 */
export function createCleanup(): DisposableRegistry {
  return new DisposableRegistry();
}
