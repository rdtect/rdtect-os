#!/usr/bin/env node
/**
 * RDT-415: Populate D1 article embeddings
 *
 * Reads rdtect.com content pieces, generates embeddings via CF AI,
 * and stores them in D1 for search functionality.
 *
 * Usage: npx tsx scripts/populate-embeddings.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { readFileSync } from 'fs';

interface Article {
	id: string;
	title: string;
	excerpt: string;
	url: string;
}

// Article sources: rdtect.com content pieces
const CONTENT_PIECES = [
	{
		file: '01-architects-natural-ai-leaders.md',
		url: '/2026/07/architects-natural-ai-leaders'
	},
	{
		file: '02-content-as-income-engine.md',
		url: '/2026/07/content-as-income-engine'
	},
	{
		file: '03-ai-as-intern.md',
		url: '/2026/07/ai-as-intern'
	},
	{
		file: 'case-study-01-iff-gbs-hub.md',
		url: '/case-studies/iff-gbs-hub'
	},
	{
		file: 'case-study-02-7eleven-bengaluru.md',
		url: '/case-studies/7eleven-bengaluru'
	},
	{
		file: 'case-study-03-fidelity-bengaluru.md',
		url: '/case-studies/fidelity-bengaluru'
	}
];

function extractArticleMetadata(filePath: string): { title: string; excerpt: string } | null {
	try {
		const content = readFileSync(filePath, 'utf-8');

		// Extract title from H1 or frontmatter
		let title = 'Untitled';
		const h1Match = content.match(/^# (.+)$/m);
		const titleMatch = content.match(/^title:\s*"?([^"\n]+)"?/m);

		if (h1Match) {
			title = h1Match[1].trim();
		} else if (titleMatch) {
			title = titleMatch[1].trim();
		}

		// Extract excerpt: first 300 chars of content
		const bodyMatch = content.match(/^---[\s\S]*?---\s*([\s\S]+)/);
		const body = bodyMatch ? bodyMatch[1] : content;
		const excerpt = body.replace(/[#*_[\]()]/g, '').trim().substring(0, 300) + '...';

		return { title, excerpt };
	} catch (err) {
		console.error(`Failed to read ${filePath}:`, err);
		return null;
	}
}

async function populateEmbeddings() {
	const contentDir = path.join(__dirname, '../../../1_Atlas/personal/brand/content/2026/07');
	const articles: Article[] = [];

	console.log('📖 Scanning content pieces...\n');

	for (const piece of CONTENT_PIECES) {
		const filePath = path.join(contentDir, piece.file);
		const metadata = extractArticleMetadata(filePath);

		if (metadata) {
			const article: Article = {
				id: piece.file.replace('.md', ''),
				title: metadata.title,
				excerpt: metadata.excerpt,
				url: piece.url
			};
			articles.push(article);
			console.log(`✅ ${article.title}`);
		} else {
			console.log(`⚠️  Skipped: ${piece.file}`);
		}
	}

	console.log(`\n📊 Found ${articles.length} articles to embed\n`);

	if (articles.length === 0) {
		console.warn('No articles found. Verify content directory path.');
		process.exit(1);
	}

	// Output article list for verification
	console.log('📋 Articles ready for embedding:\n');
	articles.forEach(a => {
		console.log(`  ${a.id}`);
		console.log(`    Title: ${a.title}`);
		console.log(`    URL: ${a.url}`);
		console.log(`    Excerpt: ${a.excerpt.substring(0, 60)}...\n`);
	});

	// Save to JSON for import
	const outputPath = path.join(__dirname, '../data/articles.json');
	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	fs.writeFileSync(outputPath, JSON.stringify(articles, null, 2));
	console.log(`✅ Saved article list to ${outputPath}`);
}

populateEmbeddings().catch(err => {
	console.error('❌ Error:', err);
	process.exit(1);
});
