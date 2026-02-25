/**
 * Event Bus - Lightweight typed event system for Desktop OS
 *
 * A simple pub/sub event bus for system-wide events.
 * Different from MessageBus which is for inter-plugin communication.
 * EventBus is for internal system events (window, desktop, theme, etc.)
 */

// === EVENT HANDLER TYPE ===
type EventHandler<T = unknown> = (data: T) => void;

// === STANDARD EVENT TYPES ===

/** Window lifecycle events */
export interface WindowEventData {
  windowId: string;
  appId: string;
  title?: string;
}

/** Window snap events */
export interface WindowSnapEventData {
  windowId: string;
  appId: string;
  zone?: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'maximize';
}

/** App lifecycle events */
export interface AppEventData {
  appId: string;
  title?: string;
}

/** Desktop context menu event */
export interface DesktopContextMenuEventData {
  x: number;
  y: number;
}

/** Theme changed event */
export interface ThemeChangedEventData {
  themeId: string;
  previousThemeId: string;
}

/** Notification events */
export interface NotificationEventData {
  id: string;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

/** Notification dismiss event */
export interface NotificationDismissEventData {
  id: string;
}

/** File open event */
export interface FileOpenEventData {
  path: string;
  appId?: string;
  mimeType?: string;
}

/** File operation events */
export interface FileOperationEventData {
  operation: 'copy' | 'cut' | 'paste' | 'delete' | 'rename' | 'create';
  paths: string[];
  destination?: string;
}

/** App load file event - send file to an opened app window */
export interface AppLoadFileEventData {
  windowId: string;
  path: string;
}

/** App message event - generic message to a window */
export interface AppMessageEventData {
  windowId: string;
  action: string;
  data?: Record<string, unknown>;
}

// === EVENT MAP ===
export interface EventMap {
  // Window events
  'window:opened': WindowEventData;
  'window:closed': WindowEventData;
  'window:focused': WindowEventData;
  'window:minimized': WindowEventData;
  'window:maximized': WindowEventData;
  'window:snapped': WindowSnapEventData;
  'window:unsnapped': WindowSnapEventData;

  // App events
  'app:launched': AppEventData;
  'app:closed': AppEventData;

  // Desktop events
  'desktop:contextmenu': DesktopContextMenuEventData;
  'desktop:refresh': void;

  // Theme events
  'theme:changed': ThemeChangedEventData;

  // Notification events
  'notification:show': NotificationEventData;
  'notification:dismiss': NotificationDismissEventData;

  // File events
  'file:open': FileOpenEventData;
  'file:operation': FileOperationEventData;
  'app:load-file': AppLoadFileEventData;
  'app:message': AppMessageEventData;
}

// === EVENT BUS CLASS ===
class EventBus {
  private handlers = new Map<string, Set<EventHandler<unknown>>>();

  /**
   * Subscribe to an event
   * @param event - Event name
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    const eventHandlers = this.handlers.get(event)!;
    eventHandlers.add(handler as EventHandler<unknown>);

    // Return unsubscribe function
    return () => {
      eventHandlers.delete(handler as EventHandler<unknown>);
      if (eventHandlers.size === 0) {
        this.handlers.delete(event);
      }
    };
  }

  /**
   * Unsubscribe from an event
   * @param event - Event name
   * @param handler - Handler function to remove
   */
  off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler as EventHandler<unknown>);
      if (eventHandlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  /**
   * Emit an event
   * @param event - Event name
   * @param data - Event data
   */
  emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event for a single occurrence
   * @param event - Event name
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    const wrappedHandler: EventHandler<EventMap[K]> = (data) => {
      unsubscribe();
      handler(data);
    };

    const unsubscribe = this.on(event, wrappedHandler);
    return unsubscribe;
  }

  /**
   * Remove all handlers for an event
   * @param event - Event name (optional, clears all if not provided)
   */
  clear<K extends keyof EventMap>(event?: K): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  /**
   * Get the number of handlers for an event
   * @param event - Event name
   */
  listenerCount<K extends keyof EventMap>(event: K): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}

// Singleton export
export const eventBus = new EventBus();

// Export the class for testing or custom instances
export { EventBus };
