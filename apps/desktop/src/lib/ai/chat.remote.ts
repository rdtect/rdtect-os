/**
 * AI Chat Remote Functions
 *
 * Server-side functions for AI chat using SvelteKit remote functions.
 * Proxies to the Python backend (Claude API + RAG).
 */

import { command, query } from '$app/server';

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface ChatResponse {
	message: ChatMessage;
}

interface SendMessageInput {
	sessionId: string;
	message: string;
	useRag?: boolean;
}

interface SessionInput {
	sessionId: string;
}

// In-memory chat history (per-session)
const chatHistories = new Map<string, ChatMessage[]>();

/**
 * Send a message to the AI and get a response (non-streaming fallback)
 */
export const sendMessage = command(
	'unchecked',
	async (input: SendMessageInput) => {
		const { sessionId, message, useRag = true } = input;

		if (!chatHistories.has(sessionId)) {
			chatHistories.set(sessionId, []);
		}

		const history = chatHistories.get(sessionId)!;
		history.push({ role: 'user', content: message });

		try {
			const pythonUrl = process.env.PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
			const response = await fetch(`${pythonUrl}/api/chat/stream`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: history,
					use_rag: useRag,
					system: null
				})
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Backend API error: ${error}`);
			}

			// Collect streamed tokens into a single response
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();
			let fullContent = '';

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const chunk = decoder.decode(value, { stream: true });
					for (const line of chunk.split('\n')) {
						if (line.startsWith('data: ')) {
							const data = line.slice(6);
							if (data === '[DONE]') continue;
							try {
								const parsed = JSON.parse(data);
								if (parsed.token) fullContent += parsed.token;
							} catch { /* skip */ }
						}
					}
				}
			}

			const assistantMessage: ChatMessage = {
				role: 'assistant',
				content: fullContent
			};

			history.push(assistantMessage);

			return { message: assistantMessage } satisfies ChatResponse;
		} catch (error) {
			history.pop();
			throw error;
		}
	}
);

/**
 * Get chat history for a session
 */
export const getChatHistory = query(
	'unchecked',
	async (input: SessionInput) => {
		const { sessionId } = input;
		const history = chatHistories.get(sessionId) ?? [];
		return history.filter(msg => msg.role !== 'system');
	}
);

/**
 * Clear chat history for a session
 */
export const clearChatHistory = command(
	'unchecked',
	async (input: SessionInput) => {
		const { sessionId } = input;
		chatHistories.delete(sessionId);
		return { success: true };
	}
);

/**
 * List available AI models
 */
export const getAvailableModels = query(async () => {
	return [
		{ id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku', description: 'Fast & efficient' },
		{ id: 'claude-sonnet-4-6', name: 'Claude Sonnet', description: 'Balanced' },
	];
});
