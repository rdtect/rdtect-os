import { describe, it, expect } from 'vitest';
import { getArticles, searchArticles } from '$lib/article-loader';

describe('Search Flow', () => {
	it('loads articles', () => {
		const articles = getArticles();
		expect(articles.length).toBeGreaterThan(0);
		expect(articles[0]).toHaveProperty('id');
		expect(articles[0]).toHaveProperty('title');
		expect(articles[0]).toHaveProperty('content');
	});

	it('returns all articles', () => {
		const articles = getArticles();
		expect(articles.length).toBe(6);
	});

	it('includes key articles', () => {
		const articles = getArticles();
		const ids = articles.map(a => a.id);
		expect(ids).toContain('mrax-framework');
		expect(ids).toContain('agentic-organizations');
		expect(ids).toContain('experiential-design');
		expect(ids).toContain('thought-leadership');
		expect(ids).toContain('edge-embeddings');
		expect(ids).toContain('ai-as-intern');
	});

	it('searches articles by title', () => {
		const results = searchArticles('MRAX');
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].id).toBe('mrax-framework');
	});

	it('searches articles by excerpt', () => {
		const results = searchArticles('embedding');
		expect(results.length).toBeGreaterThan(0);
	});

	it('calculates cosine similarity correctly', () => {
		function cosineSim(a: number[], b: number[]): number {
			let dot = 0, normA = 0, normB = 0;
			for (let i = 0; i < a.length; i++) {
				dot += a[i] * b[i];
				normA += a[i] * a[i];
				normB += b[i] * b[i];
			}
			return dot / (Math.sqrt(normA) * Math.sqrt(normB));
		}

		// Identical vectors should have similarity 1
		const vec1 = [1, 0, 0];
		const sim1 = cosineSim(vec1, vec1);
		expect(sim1).toBeCloseTo(1.0);

		// Orthogonal vectors should have similarity 0
		const vec2 = [1, 0, 0];
		const vec3 = [0, 1, 0];
		const sim2 = cosineSim(vec2, vec3);
		expect(sim2).toBeCloseTo(0.0, 1);

		// Parallel vectors should have similarity 1
		const vec4 = [2, 0, 0];
		const vec5 = [1, 0, 0];
		const sim3 = cosineSim(vec4, vec5);
		expect(sim3).toBeCloseTo(1.0);
	});

	it('article content has sufficient length', () => {
		const articles = getArticles();
		articles.forEach(article => {
			expect(article.content.length).toBeGreaterThan(50);
		});
	});
});
