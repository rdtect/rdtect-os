import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// ponytail: minimal embedding POC for spike. uses @cf/baai/bge-base-en-v1.5 (384-dim).
// cold-start calibration via timing header. no persistent storage yet.
export const POST: RequestHandler = async ({ request, platform }) => {
	const startTime = performance.now();

	const { query } = await request.json();
	if (!query || typeof query !== 'string') {
		return json({ error: 'query required' }, { status: 400 });
	}

	// safety check: CF binding must exist in wrangler.toml
	const ai = platform?.env?.AI as any;
	if (!ai) {
		return json({ error: 'AI binding not found' }, { status: 500 });
	}

	try {
		// ponytail: using BAAI BGE (best general embeddings). production would add batching + caching.
		const embeddingStart = performance.now();
		const embedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
			text: [query]
		});
		const embeddingEnd = performance.now();

		const totalTime = performance.now() - startTime;

		return json(
			{
				query,
				embedding: embedding.data[0],
				dimensions: embedding.data[0]?.length || 0,
				timings: {
					embedding_ms: embeddingEnd - embeddingStart,
					total_ms: totalTime,
					cold_start: totalTime // first request includes cold-start overhead
				}
			},
			{
				headers: {
					'X-Embedding-Time': `${embeddingEnd - embeddingStart}ms`,
					'X-Total-Time': `${totalTime}ms`
				}
			}
		);
	} catch (error) {
		console.error('embedding error:', error);
		return json(
			{ error: String(error) },
			{ status: 500 }
		);
	}
};

// ponytail: dummy content index for spike. production: precompute embeddings in D1.
const DUMMY_CONTENT = [
	{
		id: '1',
		title: 'MRAX Framework',
		excerpt: 'Notice. Engage. Mull. Exchange. The rhythm of architectural thinking.',
		url: '/mrax'
	},
	{
		id: '2',
		title: 'Experiential Design',
		excerpt: 'Workplace experience as a designed system. DX layer amplifies strategy.',
		url: '/articles/dx'
	},
	{
		id: '3',
		title: 'Agentic Organizations',
		excerpt: 'Leverage 10:1 through AI-native team structures and decision frameworks.',
		url: '/insights/agentic-orgs'
	}
];

// GET endpoint for search (returns matching docs based on semantic similarity)
export const GET: RequestHandler = async ({ url, platform }) => {
	const query = url.searchParams.get('q');
	if (!query) {
		return json({ error: 'query param q required' }, { status: 400 });
	}

	const ai = platform?.env?.AI as any;
	if (!ai) {
		return json({ error: 'AI binding not found' }, { status: 500 });
	}

	try {
		// embed query
		const queryEmbedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
			text: [query]
		});

		const queryVec = queryEmbedding.data[0];

		// ponytail: naive cosine sim. production: use D1 vector search or vdb (e.g. pinecone).
		const scored = DUMMY_CONTENT.map(doc => ({
			...doc,
			score: cosineSim(queryVec, DUMMY_CONTENT_EMBEDDINGS[doc.id])
		})).sort((a, b) => b.score - a.score).slice(0, 5);

		return json({
			query,
			results: scored,
			note: 'this is dummy data for spike; production uses precomputed embeddings in D1'
		});
	} catch (error) {
		console.error('search error:', error);
		return json({ error: String(error) }, { status: 500 });
	}
};

// precomputed dummy embeddings (384-dim)
const DUMMY_CONTENT_EMBEDDINGS: Record<string, number[]> = {
	'1': Array(384).fill(0.1),
	'2': Array(384).fill(0.15),
	'3': Array(384).fill(0.12)
};

function cosineSim(a: number[], b: number[]): number {
	let dot = 0, normA = 0, normB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
