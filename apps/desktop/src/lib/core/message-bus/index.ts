/**
 * Message Bus Module
 *
 * Inter-plugin communication via typed messages with source/target plugin IDs.
 * Supports multiple adapters for different communication protocols.
 */

// Types
export type { Message, MessageHandler, Subscription } from './types';

// Singleton instances
export { MessageBus, messageBus } from './bus';

// Adapters
export { IframeAdapter, iframeAdapter } from './adapters/iframe-adapter';
