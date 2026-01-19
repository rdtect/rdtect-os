/**
 * Iframe Adapter - Bridges postMessage with MessageBus
 *
 * Allows iframe plugins to participate in the MessageBus system
 * using the standard window.postMessage API.
 */
import type { Message, MessageHandler } from '../types';
import { messageBus } from '../bus';

interface IframeRegistration {
  pluginId: string;
  iframe: HTMLIFrameElement;
  origin: string;
}

export class IframeAdapter {
  private iframes: Map<string, IframeRegistration> = new Map();
  private unsubscribers: Map<string, () => void> = new Map();

  constructor() {
    // Listen for postMessage from iframes
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  /**
   * Register an iframe for message bridging
   */
  register(pluginId: string, iframe: HTMLIFrameElement, origin?: string): void {
    const iframeOrigin = origin || new URL(iframe.src).origin;

    this.iframes.set(pluginId, {
      pluginId,
      iframe,
      origin: iframeOrigin,
    });

    // Subscribe to MessageBus on behalf of the iframe
    const unsubscribe = messageBus.subscribe(pluginId, (message) => {
      this.sendToIframe(pluginId, message);
    });

    this.unsubscribers.set(pluginId, unsubscribe);

    // Send ready signal to iframe
    this.sendToIframe(pluginId, {
      id: 'system-ready',
      type: 'system:ready',
      source: 'system',
      target: pluginId,
      payload: { pluginId },
      timestamp: Date.now(),
    });
  }

  /**
   * Unregister an iframe
   */
  unregister(pluginId: string): void {
    const unsubscribe = this.unsubscribers.get(pluginId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribers.delete(pluginId);
    }

    this.iframes.delete(pluginId);
    messageBus.clearPlugin(pluginId);
  }

  /**
   * Handle incoming postMessage from iframes
   */
  private handleMessage(event: MessageEvent): void {
    // Find the iframe registration that matches this origin
    const registration = Array.from(this.iframes.values()).find(
      (reg) => reg.origin === event.origin || reg.origin === '*'
    );

    if (!registration) {
      // Ignore messages from unknown origins
      return;
    }

    const data = event.data;

    // Check if it's a Desktop OS message
    if (!data || typeof data !== 'object' || !data.__desktopOS) {
      return;
    }

    const { type, payload, target } = data;

    // Forward to MessageBus
    messageBus.send(type, payload, registration.pluginId, target);
  }

  /**
   * Send a message to an iframe
   */
  private sendToIframe(pluginId: string, message: Message): void {
    const registration = this.iframes.get(pluginId);
    if (!registration || !registration.iframe.contentWindow) {
      return;
    }

    // Wrap message for iframe consumption
    const wrappedMessage = {
      __desktopOS: true,
      ...message,
    };

    registration.iframe.contentWindow.postMessage(wrappedMessage, registration.origin);
  }

  /**
   * Get all registered plugin IDs
   */
  getRegisteredPlugins(): string[] {
    return Array.from(this.iframes.keys());
  }
}

// Singleton export
export const iframeAdapter = new IframeAdapter();
