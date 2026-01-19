/**
 * Streaming AI Chat Endpoint
 *
 * Uses Server-Sent Events (SSE) for real-time streaming of AI responses.
 * This complements the remote functions for when streaming is needed.
 */

import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { messages, model = 'gpt-4o-mini' } = await request.json();
	const apiKey = env.OPENAI_API_KEY;

	if (!messages || !Array.isArray(messages)) {
		return new Response(JSON.stringify({ error: 'Messages array required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Add system message if not present
	const fullMessages = messages[0]?.role === 'system'
		? messages
		: [
			{
				role: 'system',
				content: 'You are a helpful AI assistant in rdtect OS, a web-based desktop environment. Be concise and helpful.'
			},
			...messages
		];

	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
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
				messages: fullMessages,
				max_tokens: 2048,
				temperature: 0.7,
				stream: true
			})
		});

		if (!response.ok) {
			const error = await response.text();
			return new Response(JSON.stringify({ error: `OpenAI API error: ${error}` }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Create a TransformStream to process the SSE data
		const encoder = new TextEncoder();
		const decoder = new TextDecoder();

		const stream = new ReadableStream({
			async start(controller) {
				const reader = response.body?.getReader();
				if (!reader) {
					controller.close();
					return;
				}

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						const chunk = decoder.decode(value, { stream: true });
						const lines = chunk.split('\n');

						for (const line of lines) {
							if (line.startsWith('data: ')) {
								const data = line.slice(6);
								if (data === '[DONE]') {
									controller.enqueue(encoder.encode('data: [DONE]\n\n'));
									continue;
								}

								try {
									const parsed = JSON.parse(data);
									const content = parsed.choices?.[0]?.delta?.content;
									if (content) {
										controller.enqueue(
											encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
										);
									}
								} catch {
									// Skip malformed JSON
								}
							}
						}
					}
				} catch (error) {
					controller.error(error);
				} finally {
					controller.close();
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive'
			}
		});
	} catch (error) {
		return new Response(
			JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
