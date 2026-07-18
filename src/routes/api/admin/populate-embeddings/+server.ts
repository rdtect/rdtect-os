import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface Article {
	id: string;
	title: string;
	excerpt: string;
	url: string;
}

// Embedded articles list from RDT-415 scanning
const ARTICLES: Article[] = [
	{
		id: '01-architects-natural-ai-leaders',
		title: 'Architects Are Natural AI Leaders',
		excerpt: 'Architects are uniquely positioned to lead AI integration in the built environment.',
		url: '/architects'
	},
	{
		id: '02-content-as-income-engine',
		title: 'Content as Income Engine — Piece #2',
		excerpt: 'Content generation at scale drives sustainable revenue streams.',
		url: '/content-engine'
	},
	{
		id: '03-ai-as-intern',
		title: 'AI is an Intern, Not a Master',
		excerpt: 'AI excels as a collaborative tool under human guidance.',
		url: '/ai-intern'
	},
	{
		id: 'case-study-01-iff-gbs-hub',
		title: 'Case Study: IFF Global Business Services Hub',
		excerpt: 'Designing for collaboration and innovation in GBS environments.',
		url: '/case-studies/iff'
	},
	{
		id: 'case-study-02-7eleven-bengaluru',
		title: 'Case Study: 7-Eleven Bengaluru',
		excerpt: 'Urban retail experiential design for convenience and engagement.',
		url: '/case-studies/7eleven'
	},
	{
		id: 'case-study-03-fidelity-bengaluru',
		title: 'Case Study: Fidelity Bengaluru',
		excerpt: 'Financial services workspace innovation and employee experience.',
		url: '/case-studies/fidelity'
	}
];

export const POST: RequestHandler = async ({ request, platform }) => {
	// ponytail: simple auth check — token in Authorization header
	const authHeader = request.headers.get('Authorization');
	const token = authHeader?.replace('Bearer ', '');
	const adminToken = platform?.env?.ADMIN_TOKEN as string;

	if (!token || token !== adminToken) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const ai = platform?.env?.AI as any;
	const db = platform?.env?.DB as any;

	if (!ai || !db) {
		return json({ error: 'Missing AI or DB binding' }, { status: 500 });
	}

	const results = [];
	let succeeded = 0;
	let failed = 0;

	try {
		// Create table if not exists
		await db.prepare(`
			CREATE TABLE IF NOT EXISTS articles (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				excerpt TEXT NOT NULL,
				url TEXT NOT NULL,
				embedding TEXT NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`).run();

		// Generate embeddings and insert
		for (const article of ARTICLES) {
			try {
				// Embed title + excerpt as search key
				const searchText = `${article.title} ${article.excerpt}`;
				const embeddingResult = await ai.run('@cf/baai/bge-base-en-v1.5', {
					text: [searchText]
				});

				if (!embeddingResult?.data?.[0]) {
					throw new Error('No embedding returned');
				}

				const embedding = embeddingResult.data[0];

				// Insert into D1
				await db.prepare(`
					INSERT OR REPLACE INTO articles (id, title, excerpt, url, embedding)
					VALUES (?, ?, ?, ?, ?)
				`).bind(article.id, article.title, article.excerpt, article.url, JSON.stringify(embedding)).run();

				results.push({
					article: article.id,
					status: 'inserted',
					dimensions: embedding.length
				});
				succeeded++;
			} catch (err) {
				results.push({
					article: article.id,
					status: 'failed',
					error: String(err)
				});
				failed++;
			}
		}

		return json({
			success: true,
			summary: { total: ARTICLES.length, succeeded, failed },
			results
		});
	} catch (err) {
		console.error('Embedding population error:', err);
		return json(
			{ error: String(err), status: 'failed' },
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async () => {
	return json({
		message: 'POST to populate embeddings (requires ADMIN_TOKEN in Authorization header)',
		articles: ARTICLES.length
	});
};
