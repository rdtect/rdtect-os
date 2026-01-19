/**
 * Plugin SDK Client
 *
 * For use in iframe plugins to communicate with the Desktop OS host.
 * Uses postMessage for bidirectional communication.
 */

interface Message {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: unknown;
  timestamp: number;
}

type MessageHandler = (message: Message) => void | Promise<void>;

interface DesktopOSClient {
  pluginId: string | null;
  isReady: boolean;
  send: (type: string, payload: unknown, target?: string) => void;
  subscribe: (handler: MessageHandler) => () => void;
  request: <T>(type: string, payload: unknown, target: string, timeout?: number) => Promise<T>;
  onReady: (callback: () => void) => void;
}

/**
 * Create a Desktop OS client for iframe plugins
 */
export function createClient(): DesktopOSClient {
  let pluginId: string | null = null;
  let isReady = false;
  const handlers: Set<MessageHandler> = new Set();
  const readyCallbacks: Set<() => void> = new Set();

  // Listen for messages from host
  window.addEventListener('message', (event) => {
    const data = event.data;

    // Check if it's a Desktop OS message
    if (!data || typeof data !== 'object' || !data.__desktopOS) {
      return;
    }

    // Handle ready signal
    if (data.type === 'system:ready') {
      pluginId = data.payload?.pluginId || null;
      isReady = true;
      readyCallbacks.forEach((cb) => cb());
      return;
    }

    // Forward to handlers
    const message: Message = {
      id: data.id,
      type: data.type,
      source: data.source,
      target: data.target,
      payload: data.payload,
      timestamp: data.timestamp,
    };

    handlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  });

  return {
    get pluginId() {
      return pluginId;
    },

    get isReady() {
      return isReady;
    },

    /**
     * Send a message to the host or another plugin
     */
    send(type: string, payload: unknown, target?: string): void {
      if (!pluginId) {
        console.warn('Plugin not yet initialized. Queue message or wait for ready.');
      }

      window.parent.postMessage(
        {
          __desktopOS: true,
          type,
          payload,
          target: target || '*',
        },
        '*'
      );
    },

    /**
     * Subscribe to incoming messages
     */
    subscribe(handler: MessageHandler): () => void {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },

    /**
     * Send a request and wait for response
     */
    async request<T>(
      type: string,
      payload: unknown,
      target: string,
      timeout = 5000
    ): Promise<T> {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          unsubscribe();
          reject(new Error(`Request timeout: ${type}`));
        }, timeout);

        const unsubscribe = this.subscribe((message) => {
          if (
            message.type === `${type}:response` &&
            (message.payload as { requestId?: string })?.requestId === requestId
          ) {
            clearTimeout(timer);
            unsubscribe();
            resolve((message.payload as { data: T }).data);
          }
        });

        this.send(type, { requestId, data: payload }, target);
      });
    },

    /**
     * Register a callback for when the client is ready
     */
    onReady(callback: () => void): void {
      if (isReady) {
        callback();
      } else {
        readyCallbacks.add(callback);
      }
    },
  };
}

// Default client instance for convenience
export const desktopOS = createClient();
