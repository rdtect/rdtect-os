/**
 * Plugin SDK Client Tests
 * 
 * These tests mock the browser window API to test the client in Node.js environment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mocks at module scope
const addEventListenerMock = vi.fn();
const postMessageMock = vi.fn();

// Mock window before importing the module
vi.stubGlobal('window', {
	addEventListener: addEventListenerMock,
	removeEventListener: vi.fn(),
	parent: {
		postMessage: postMessageMock,
	},
	dispatchEvent: vi.fn(),
});

import { createClient } from './client';

describe('Plugin SDK Client', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Re-setup postMessage mock after clear
		(window.parent as any).postMessage = postMessageMock;
	});

	describe('createClient', () => {
		it('should create a client with default state', () => {
			const client = createClient();

			expect(client.pluginId).toBeNull();
			expect(client.isReady).toBe(false);
			expect(typeof client.send).toBe('function');
			expect(typeof client.subscribe).toBe('function');
			expect(typeof client.request).toBe('function');
			expect(typeof client.onReady).toBe('function');
		});

		it('should register message event listener', () => {
			createClient();

			expect(addEventListenerMock).toHaveBeenCalledWith(
				'message',
				expect.any(Function)
			);
		});
	});

	describe('send', () => {
		it('should post message to parent with correct structure', () => {
			const client = createClient();
			
			// Trigger ready state
			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];
			
			if (messageHandler) {
				messageHandler({
					data: { __desktopOS: true, type: 'system:ready', payload: { pluginId: 'test-plugin' } },
				});
			}

			client.send('custom:event', { foo: 'bar' }, 'target-plugin');

			expect(postMessageMock).toHaveBeenCalledWith(
				expect.objectContaining({
					__desktopOS: true,
					type: 'custom:event',
					payload: { foo: 'bar' },
					target: 'target-plugin',
				}),
				'*'
			);
		});

		it('should default target to * when not specified', () => {
			const client = createClient();
			
			// Trigger ready state
			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];
			
			if (messageHandler) {
				messageHandler({
					data: { __desktopOS: true, type: 'system:ready', payload: { pluginId: 'test-plugin' } },
				});
			}

			client.send('custom:event', { data: 'test' });

			expect(postMessageMock).toHaveBeenCalledWith(
				expect.objectContaining({
					target: '*',
				}),
				'*'
			);
		});
	});

	describe('subscribe', () => {
		it('should return unsubscribe function', () => {
			const client = createClient();
			const handler = vi.fn();

			const unsubscribe = client.subscribe(handler);

			expect(typeof unsubscribe).toBe('function');
		});

		it('should call handler when DesktopOS message received', () => {
			const client = createClient();
			const handler = vi.fn();

			client.subscribe(handler);

			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];

			if (messageHandler) {
				messageHandler({
					data: {
						__desktopOS: true,
						type: 'test:message',
						id: 'msg-1',
						source: 'host',
						target: 'plugin',
						payload: { value: 42 },
						timestamp: Date.now(),
					},
				});
			}

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'test:message',
					payload: { value: 42 },
				})
			);
		});

		it('should ignore non-DesktopOS messages', () => {
			const client = createClient();
			const handler = vi.fn();

			client.subscribe(handler);

			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];

			if (messageHandler) {
				messageHandler({
					data: { type: 'some-other-message' },
				});
			}

			expect(handler).not.toHaveBeenCalled();
		});

		it('should unsubscribe correctly', () => {
			const client = createClient();
			const handler = vi.fn();

			const unsubscribe = client.subscribe(handler);
			unsubscribe();

			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];

			if (messageHandler) {
				messageHandler({
					data: {
						__desktopOS: true,
						type: 'test:message',
						payload: {},
					},
				});
			}

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe('onReady', () => {
		it('should call callback immediately if already ready', () => {
			const client = createClient();
			const callback = vi.fn();

			// Trigger ready state before calling onReady
			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];
			
			if (messageHandler) {
				messageHandler({
					data: { __desktopOS: true, type: 'system:ready', payload: { pluginId: 'test' } },
				});
			}

			client.onReady(callback);

			expect(callback).toHaveBeenCalled();
		});

		it('should queue callback and call when ready', () => {
			const client = createClient();
			const callback = vi.fn();

			// Call onReady before ready state
			client.onReady(callback);
			expect(callback).not.toHaveBeenCalled();

			// Trigger ready state
			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];
			
			if (messageHandler) {
				messageHandler({
					data: { __desktopOS: true, type: 'system:ready', payload: { pluginId: 'test' } },
				});
			}

			expect(callback).toHaveBeenCalled();
		});

		it('should set pluginId when ready', () => {
			const client = createClient();

			expect(client.pluginId).toBeNull();

			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];
			
			if (messageHandler) {
				messageHandler({
					data: { __desktopOS: true, type: 'system:ready', payload: { pluginId: 'my-plugin' } },
				});
			}

			expect(client.pluginId).toBe('my-plugin');
			expect(client.isReady).toBe(true);
		});
	});

	describe('request', () => {
		it('should timeout after specified duration', async () => {
			const client = createClient();
			
			// Trigger ready state
			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];
			
			if (messageHandler) {
				messageHandler({
					data: { __desktopOS: true, type: 'system:ready', payload: { pluginId: 'test' } },
				});
			}

			const promise = client.request('test:action', {}, 'target', 100);

			await expect(promise).rejects.toThrow('Request timeout: test:action');
		});

		it('should send request message with requestId', () => {
			const client = createClient();
			
			// Trigger ready state
			const messageHandler = addEventListenerMock.mock.calls.find(
				([type]: [string, Function]) => type === 'message'
			)?.[1];
			
			if (messageHandler) {
				messageHandler({
					data: { __desktopOS: true, type: 'system:ready', payload: { pluginId: 'test' } },
				});
			}

			// Start request without awaiting (will timeout)
			client.request('test:request', { key: 'value' }, 'target', 10000);

			// Verify request was sent with correct structure
			// Note: request() doesn't await, so we check postMessage was called
			// The actual response handling would happen asynchronously
			expect(postMessageMock).toHaveBeenCalledWith(
				expect.objectContaining({
					__desktopOS: true,
					type: 'test:request',
					payload: expect.objectContaining({
						data: { key: 'value' },
						requestId: expect.any(String),
					}),
					target: 'target',
				}),
				'*'
			);
		});
	});
});
