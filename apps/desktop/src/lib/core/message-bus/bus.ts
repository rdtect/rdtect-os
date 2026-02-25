/**
 * MessageBus - Core inter-plugin communication system
 *
 * Provides a pub/sub messaging system for plugins to communicate
 * regardless of their type (native, iframe, webcomponent, etc.)
 */
import type { Message, MessageHandler, Subscription } from './types';

export class MessageBus {
  private subscriptions: Map<string, Subscription> = new Map();
  private messageQueue: Message[] = [];
  private idCounter = 0;

  /**
   * Subscribe to messages
   * @param pluginId - ID of the subscribing plugin
   * @param handler - Function to handle incoming messages
   * @param filter - Optional message type filter
   * @returns Unsubscribe function
   */
  subscribe(pluginId: string, handler: MessageHandler, filter?: string): () => void {
    const subscriptionId = `sub-${Date.now()}-${this.idCounter++}`;

    const subscription: Subscription = {
      id: subscriptionId,
      pluginId,
      handler,
      filter,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Process any queued messages for this subscriber
    this.processQueuedMessages(subscription);

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(subscriptionId);
    };
  }

  /**
   * Send a message
   * @param type - Message type
   * @param payload - Message payload
   * @param source - Source plugin ID
   * @param target - Target plugin ID (optional, '*' for broadcast)
   */
  send(type: string, payload: unknown, source: string, target?: string): void {
    const message: Message = {
      id: `msg-${Date.now()}-${this.idCounter++}`,
      type,
      source,
      target: target || '*',
      payload,
      timestamp: Date.now(),
    };

    this.dispatch(message);
  }

  /**
   * Send a message and wait for a response
   * @param type - Message type
   * @param payload - Message payload
   * @param source - Source plugin ID
   * @param target - Target plugin ID
   * @param timeout - Timeout in ms (default 5000)
   */
  async request<T>(
    type: string,
    payload: unknown,
    source: string,
    target: string,
    timeout = 5000
  ): Promise<T> {
    const requestId = `req-${Date.now()}-${this.idCounter++}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      const unsubscribe = this.subscribe(source, (message) => {
        if (message.type === `${type}:response` && (message.payload as { requestId?: string })?.requestId === requestId) {
          clearTimeout(timer);
          unsubscribe();
          resolve((message.payload as { data: T }).data);
        }
      }, `${type}:response`);

      // Send the request
      this.send(type, { requestId, data: payload }, source, target);
    });
  }

  /**
   * Respond to a request message
   */
  respond(originalMessage: Message, payload: unknown, source: string): void {
    const requestId = (originalMessage.payload as { requestId?: string })?.requestId;
    if (!requestId) return;

    this.send(
      `${originalMessage.type}:response`,
      { requestId, data: payload },
      source,
      originalMessage.source
    );
  }

  /**
   * Dispatch a message to all matching subscribers
   */
  private dispatch(message: Message): void {
    this.subscriptions.forEach((subscription) => {
      if (this.shouldDeliver(message, subscription)) {
        try {
          subscription.handler(message);
        } catch (error) {
          console.error(`Error in message handler for ${subscription.pluginId}:`, error);
        }
      }
    });
  }

  /**
   * Determine if a message should be delivered to a subscription
   */
  private shouldDeliver(message: Message, subscription: Subscription): boolean {
    // Don't deliver to self
    if (message.source === subscription.pluginId) {
      return false;
    }

    // Check target
    if (message.target !== '*' && message.target !== subscription.pluginId) {
      return false;
    }

    // Check filter
    if (subscription.filter && message.type !== subscription.filter) {
      return false;
    }

    return true;
  }

  /**
   * Process any queued messages for a new subscriber
   */
  private processQueuedMessages(subscription: Subscription): void {
    const relevantMessages = this.messageQueue.filter(
      (msg) => this.shouldDeliver(msg, subscription)
    );

    relevantMessages.forEach((message) => {
      try {
        subscription.handler(message);
      } catch (error) {
        console.error(`Error processing queued message for ${subscription.pluginId}:`, error);
      }
    });
  }

  /**
   * Queue a message for later delivery (useful for plugins not yet loaded)
   */
  queue(message: Message): void {
    this.messageQueue.push(message);
    // Keep queue bounded
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  /**
   * Clear all subscriptions for a plugin
   */
  clearPlugin(pluginId: string): void {
    this.subscriptions.forEach((subscription, id) => {
      if (subscription.pluginId === pluginId) {
        this.subscriptions.delete(id);
      }
    });
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
    this.messageQueue = [];
  }
}

// Singleton export
export const messageBus = new MessageBus();
