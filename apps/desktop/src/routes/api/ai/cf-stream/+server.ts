import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const CF_MODELS: Record<string, string> = {
  'llama-3.1-8b': '@cf/meta/llama-3.1-8b-instruct',
  'llama-3.3-70b': '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  'deepseek-r1': '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
  'qwen-2.5-coder': '@cf/qwen/qwen2.5-coder-32b-instruct',
};

export const POST: RequestHandler = async ({ request }) => {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const gatewayId = env.CLOUDFLARE_AI_GATEWAY_ID;

  if (!accountId || !apiToken) {
    return new Response(JSON.stringify({ error: 'Cloudflare AI not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await request.json();
  const { messages, model = 'llama-3.1-8b', system } = body;

  const cfModel = CF_MODELS[model] || CF_MODELS['llama-3.1-8b'];

  // Use AI Gateway if configured, otherwise direct Workers AI
  const baseUrl = gatewayId
    ? `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/workers-ai`
    : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run`;

  const url = `${baseUrl}/${cfModel}`;

  const cfMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: cfMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(JSON.stringify({ error: `CF AI error: ${errorText}` }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Transform CF SSE format to match our existing format
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const token = parsed.response || '';
                if (token) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              } catch { /* skip malformed */ }
            }
          }
        }
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
};
