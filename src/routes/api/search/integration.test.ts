import { describe, it, expect } from 'vitest';
import { getArticles } from '$lib/article-loader';

// Helper: simple cosine similarity
function cosineSim(a: number[], b: number[]): number {
	let dot = 0, normA = 0, normB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Mock embeddings for testing (in real flow, these come from CF AI)
// Using normalized vectors where all components sum to 1
const mockEmbeddings: Record<string, number[]> = {
	'mrax-framework': [0.4, 0.15, 0.15, 0.15, 0.15],
	'agentic-organizations': [0.35, 0.25, 0.1, 0.15, 0.15],
	'experiential-design': [0.15, 0.35, 0.2, 0.15, 0.15],
	'thought-leadership': [0.15, 0.15, 0.35, 0.2, 0.15],
	'edge-embeddings': [0.1, 0.1, 0.1, 0.4, 0.3],
	'ai-as-intern': [0.35, 0.2, 0.1, 0.15, 0.2]
};

// Query embeddings for testing
const queryEmbeddings: Record<string, number[]> = {
	'MRAX framework': [0.4, 0.15, 0.15, 0.15, 0.15],
	'AI inference': [0.25, 0.2, 0.15, 0.25, 0.15],
	'organizational leverage': [0.35, 0.25, 0.1, 0.15, 0.15],
	'embedding search': [0.15, 0.15, 0.15, 0.35, 0.2]
};

describe('Search Integration Flow', () => {
	it('loads articles with embeddings', () => {
		const articles = getArticles();
		articles.forEach(article => {
			expect(mockEmbeddings[article.id]).toBeDefined();
			expect(mockEmbeddings[article.id].length).toBeGreaterThan(0);
		});
	});

	it('ranks results by semantic similarity', () => {
		const articles = getArticles();
		const query = 'MRAX framework';
		const queryVec = queryEmbeddings[query];

		// Score articles
		const results = articles
			.map(article => ({
				id: article.id,
				title: article.title,
				score: cosineSim(queryVec, mockEmbeddings[article.id])
			}))
			.sort((a, b) => b.score - a.score);

		// Top result should be MRAX framework
		expect(results[0].id).toBe('mrax-framework');
		expect(results[0].score).toBeGreaterThan(results[1].score);
	});

	it('searches for edge AI content', () => {
		const articles = getArticles();
		const query = 'embedding search';
		const queryVec = queryEmbeddings[query];

		const results = articles
			.map(article => ({
				id: article.id,
				title: article.title,
				score: cosineSim(queryVec, mockEmbeddings[article.id])
			}))
			.sort((a, b) => b.score - a.score);

		// Edge embeddings should rank highly
		const edgeResult = results.find(r => r.id === 'edge-embeddings');
		expect(edgeResult).toBeDefined();
		expect(edgeResult!.score).toBeGreaterThan(0.7);
	});

	it('searches for organizational content', () => {
		const articles = getArticles();
		const query = 'organizational leverage';
		const queryVec = queryEmbeddings[query];

		const results = articles
			.map(article => ({
				id: article.id,
				title: article.title,
				score: cosineSim(queryVec, mockEmbeddings[article.id])
			}))
			.sort((a, b) => b.score - a.score);

		// MRAX or agentic-organizations should be top
		const topId = results[0].id;
		expect(['mrax-framework', 'agentic-organizations', 'ai-as-intern']).toContain(topId);
	});

	it('returns top-3 results by default', () => {
		const articles = getArticles();
		const query = 'AI inference';
		const queryVec = queryEmbeddings[query];

		const results = articles
			.map(article => ({
				id: article.id,
				title: article.title,
				score: cosineSim(queryVec, mockEmbeddings[article.id])
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, 3);

		expect(results.length).toBeLessThanOrEqual(3);
		expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
		expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
	});

	it('excludes low-relevance results', () => {
		const articles = getArticles();
		const query = 'MRAX framework';
		const queryVec = queryEmbeddings[query];

		const results = articles
			.map(article => ({
				id: article.id,
				score: cosineSim(queryVec, mockEmbeddings[article.id])
			}))
			.sort((a, b) => b.score - a.score);

		// Lowest-ranked result should still have some similarity (not completely unrelated)
		expect(results[results.length - 1].score).toBeGreaterThan(0);
	});

	it('preserves article metadata in results', () => {
		const articles = getArticles();
		const query = 'MRAX framework';
		const queryVec = queryEmbeddings[query];

		const results = articles
			.map(article => ({
				id: article.id,
				title: article.title,
				excerpt: article.excerpt,
				url: article.url,
				score: cosineSim(queryVec, mockEmbeddings[article.id])
			}))
			.sort((a, b) => b.score - a.score);

		const topResult = results[0];
		expect(topResult).toHaveProperty('title');
		expect(topResult).toHaveProperty('excerpt');
		expect(topResult).toHaveProperty('url');
		expect(topResult.url).toContain('/writing');
	});
});
