import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) return 0;
	let dot = 0, normA = 0, normB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	const denominator = Math.sqrt(normA) * Math.sqrt(normB);
	return denominator === 0 ? 0 : dot / denominator;
}

interface SearchResult {
	id: string;
	title: string;
	excerpt: string;
	url: string;
	score: number;
}

export const GET: RequestHandler = async ({ url, platform }) => {
	const query = url.searchParams.get('q');
	const limit = parseInt(url.searchParams.get('limit') || '3', 10);
	const ai = platform?.env?.AI as any;
	const db = platform?.env?.DB as any;

	if (!query) {
		return json({
			error: 'Missing query parameter: q',
			status: 'error'
		}, { status: 400 });
	}

	if (!ai || !db) {
		return json({
			error: 'AI binding or D1 not found',
			status: 'error'
		}, { status: 500 });
	}

	try {
		// Embed the query
		const queryResult = await ai.run('@cf/baai/bge-base-en-v1.5', {
			text: [query]
		});
		const queryEmbedding = queryResult.data[0];

		// Fetch all articles with embeddings
		const articles = await db.prepare(`
			SELECT id, title, excerpt, url, embedding
			FROM articles
		`).all() as any;

		if (!articles.results || articles.results.length === 0) {
			return json({
				results: [],
				status: 'ok',
				message: 'No articles found in database'
			});
		}

		// Score and rank articles
		const scored: SearchResult[] = articles.results
			.map((row: any) => {
				try {
					const embedding = JSON.parse(row.embedding);
					const score = cosineSimilarity(queryEmbedding, embedding);
					return {
						id: row.id,
						title: row.title,
						excerpt: row.excerpt,
						url: row.url,
						score
					};
				} catch (e) {
					console.error(`Failed to parse embedding for ${row.id}:`, e);
					return null;
				}
			})
			.filter(Boolean as any)
			.sort((a: SearchResult, b: SearchResult) => b.score - a.score)
			.slice(0, limit);

		return json({
			status: 'ok',
			query,
			results: scored,
			total_results: scored.length
		});
	} catch (error) {
		console.error('Search error:', error);
		return json({
			error: String(error),
			status: 'error'
		}, { status: 500 });
	}
};
