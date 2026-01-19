/**
 * AI Chat Remote Functions
 *
 * Server-side functions for AI chat using SvelteKit remote functions.
 * These run on the server but can be called from components like regular functions.
 */

import { command, query } from '$app/server';
import { env } from '$env/dynamic/private';

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface ChatResponse {
	message: ChatMessage;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

interface SendMessageInput {
	sessionId: string;
	message: string;
	model?: string;
}

interface SessionInput {
	sessionId: string;
}

// In-memory chat history (per-session, would use DB in production)
const chatHistories = new Map<string, ChatMessage[]>();

/**
 * Send a message to the AI and get a response
 */
export const sendMessage = command(
	'unchecked',
	async (input: SendMessageInput) => {
		const { sessionId, message, model = 'gpt-4o-mini' } = input;

		// Get or create chat history for this session
		if (!chatHistories.has(sessionId)) {
			chatHistories.set(sessionId, [
				{
					role: 'system',
					content: 'You are a helpful AI assistant in rdtect OS, a web-based desktop environment. Be concise and helpful.'
				}
			]);
		}

		const history = chatHistories.get(sessionId)!;

		// Add user message to history
		history.push({ role: 'user', content: message });

		const apiKey = env.OPENAI_API_KEY;
		if (!apiKey) {
			history.pop();
			throw new Error('OPENAI_API_KEY not configured');
		}

		try {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model,
					messages: history,
					max_tokens: 2048,
					temperature: 0.7
				})
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`OpenAI API error: ${error}`);
			}

			const data = await response.json();
			const assistantMessage: ChatMessage = {
				role: 'assistant',
				content: data.choices[0].message.content
			};

			// Add assistant response to history
			history.push(assistantMessage);

			return {
				message: assistantMessage,
				usage: data.usage ? {
					promptTokens: data.usage.prompt_tokens,
					completionTokens: data.usage.completion_tokens,
					totalTokens: data.usage.total_tokens
				} : undefined
			} satisfies ChatResponse;
		} catch (error) {
			// Remove failed user message from history
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
		// Filter out system messages for display
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
		{ id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient' },
		{ id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable' },
		{ id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Balanced performance' },
		{ id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Legacy fast model' }
	];
});
