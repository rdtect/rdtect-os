import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getArticles } from '$lib/article-loader';

interface Article {
	id: string;
	title: string;
	excerpt: string;
	url: string;
	content: string;
}

// Initialize D1 schema if needed
async function initSchema(db: any): Promise<void> {
	try {
		await db.prepare(`
			CREATE TABLE IF NOT EXISTS articles (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				excerpt TEXT,
				url TEXT,
				embedding TEXT NOT NULL,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP
			)
		`).run();
	} catch (error) {
		console.log('Schema already exists:', error);
	}
}

// Batch embed articles using CF AI binding
async function embedArticles(
	ai: any,
	articles: Article[]
): Promise<Array<Article & { embedding: number[] }>> {
	const embeddings = [];

	for (const article of articles) {
		try {
			const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
				text: [article.excerpt || article.title]
			});
			embeddings.push({
				...article,
				embedding: result.data[0]
			});
		} catch (error) {
			console.error(`Failed to embed ${article.id}:`, error);
		}
	}

	return embeddings;
}

// Store embeddings in D1
async function storeEmbeddings(
	db: any,
	embeddings: Array<Article & { embedding: number[] }>
): Promise<number> {
	let stored = 0;

	for (const article of embeddings) {
		try {
			await db.prepare(`
				INSERT OR REPLACE INTO articles
				(id, title, excerpt, url, embedding)
				VALUES (?, ?, ?, ?, ?)
			`).bind(
				article.id,
				article.title,
				article.excerpt,
				article.url,
				JSON.stringify(article.embedding)
			).run();
			stored++;
		} catch (error) {
			console.error(`Failed to store ${article.id}:`, error);
		}
	}

	return stored;
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const ai = platform?.env?.AI as any;
	const db = platform?.env?.DB as any;

	if (!ai || !db) {
		return json({
			error: 'AI binding or D1 not found',
			status: 'error'
		}, { status: 500 });
	}

	try {
		// Initialize schema
		await initSchema(db);

		// Get articles: from payload or use defaults
		let articles: Article[] = [];
		const contentType = request.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			const payload = await request.json();
			articles = payload.articles || getArticles();
		} else {
			articles = getArticles();
		}

		// Embed articles
		console.log(`📚 Embedding ${articles.length} articles...`);
		const embeddings = await embedArticles(ai, articles);

		// Store in D1
		console.log(`💾 Storing ${embeddings.length} embeddings...`);
		const stored = await storeEmbeddings(db, embeddings);

		return json({
			status: 'success',
			articles_processed: articles.length,
			articles_stored: stored,
			failed: articles.length - stored
		});
	} catch (error) {
		console.error('Populate error:', error);
		return json({
			error: String(error),
			status: 'error'
		}, { status: 500 });
	}
};

// GET endpoint for inspection (returns table stats)
export const GET: RequestHandler = async ({ platform }) => {
	const db = platform?.env?.DB as any;

	if (!db) {
		return json({
			error: 'D1 not found',
			status: 'error'
		}, { status: 500 });
	}

	try {
		const result = await db.prepare('SELECT COUNT(*) as count FROM articles').first() as any;
		return json({
			status: 'ok',
			articles_count: result?.count || 0
		});
	} catch (error) {
		return json({
			status: 'error',
			error: String(error)
		}, { status: 500 });
	}
};
