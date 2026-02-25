/**
 * Message passed between plugins
 */
export interface Message {
  id: string;
  type: string;
  source: string;        // Plugin ID or 'system'
  target?: string;       // Plugin ID, '*' for broadcast, undefined for system
  payload: unknown;
  timestamp: number;
}

/**
 * Message handler function
 */
export type MessageHandler = (message: Message) => void | Promise<void>;

/**
 * Subscription with metadata
 */
export interface Subscription {
  id: string;
  pluginId: string;
  handler: MessageHandler;
  filter?: string;       // Message type filter
}
