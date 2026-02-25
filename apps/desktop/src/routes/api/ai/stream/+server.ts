/**
 * Streaming AI Chat Endpoint — Proxy to Python Backend
 *
 * Forwards requests to the Python backend's /api/chat/stream endpoint.
 * Streams SSE responses back to the client.
 */

import { env } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const PYTHON_API_URL = env.PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { messages, use_rag = true, system = null } = body;

	if (!messages || !Array.isArray(messages)) {
		return new Response(JSON.stringify({ error: 'Messages array required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const response = await fetch(`${PYTHON_API_URL}/api/chat/stream`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages, use_rag, system })
		});

		if (!response.ok) {
			const error = await response.text();
			return new Response(JSON.stringify({ error: `Backend API error: ${error}` }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Pass through the SSE stream from the Python backend
		return new Response(response.body, {
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
