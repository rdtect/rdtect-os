import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const startTime = performance.now();

	const { query } = await request.json();
	if (!query || typeof query !== 'string') {
		return json({ error: 'query required' }, { status: 400 });
	}

	const ai = platform?.env?.AI as any;
	if (!ai) {
		return json({ error: 'AI binding not found' }, { status: 500 });
	}

	try {
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
					cold_start: totalTime
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

export const GET: RequestHandler = async ({ url, platform }) => {
	const query = url.searchParams.get('q');
	if (!query) {
		return json({ error: 'query param q required' }, { status: 400 });
	}

	const ai = platform?.env?.AI as any;
	const db = platform?.env?.DB as any;
	if (!ai) {
		return json({ error: 'AI binding not found' }, { status: 500 });
	}

	try {
		// Embed query
		const queryEmbedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
			text: [query]
		});
		const queryVec = queryEmbedding.data[0];

		// Fetch all articles with embeddings from D1
		let articles: any[] = [];
		if (db) {
			try {
				const result = await db.prepare('SELECT id, title, excerpt, url, embedding FROM articles LIMIT 100').all();
				articles = result.results || [];
			} catch (err) {
				console.warn('D1 query failed:', err);
				// fall back to empty results
			}
		}

		// Score and sort by cosine similarity
		const scored = articles
			.map(doc => ({
				id: doc.id,
				title: doc.title,
				excerpt: doc.excerpt,
				url: doc.url,
				score: cosineSim(queryVec, JSON.parse(doc.embedding))
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, 5);

		return json({
			query,
			results: scored,
			count: scored.length
		});
	} catch (error) {
		console.error('search error:', error);
		return json({ error: String(error) }, { status: 500 });
	}
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
