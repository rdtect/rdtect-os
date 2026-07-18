#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(__filename);
// Path: rdtect-os/scripts/populate-embeddings.mjs → rdtect/1_Atlas/personal/brand/content/2026/07
const contentDir = path.join(scriptDir, '../../../../Documents/rdtect/1_Atlas/personal/brand/content/2026/07');

const CONTENT_PIECES = [
	{ file: '01-architects-natural-ai-leaders.md', url: '/architects' },
	{ file: '02-content-as-income-engine.md', url: '/content-engine' },
	{ file: '03-ai-as-intern.md', url: '/ai-intern' },
	{ file: 'case-study-01-iff-gbs-hub.md', url: '/case-studies/iff' },
	{ file: 'case-study-02-7eleven-bengaluru.md', url: '/case-studies/7eleven' },
	{ file: 'case-study-03-fidelity-bengaluru.md', url: '/case-studies/fidelity' }
];

function extractMetadata(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');

		// Extract title
		let title = 'Untitled';
		const h1 = content.match(/^# (.+)$/m);
		const frontmatter = content.match(/^title:\s*"?([^"\n]+)"?/m);

		if (h1) title = h1[1].trim();
		else if (frontmatter) title = frontmatter[1].trim();

		// Extract excerpt
		const body = content.match(/^---[\s\S]*?---\s*([\s\S]+)/) || [null, content];
		const excerpt = body[1].replace(/[#*_[\]()]/g, '').trim().substring(0, 300) + '...';

		return { title, excerpt };
	} catch (err) {
		console.error(`✗ ${path.basename(filePath)}: ${err.message}`);
		return null;
	}
}

async function main() {
	const articles = [];

	console.log(`📖 Scanning content from: ${contentDir}\n`);

	for (const piece of CONTENT_PIECES) {
		const filePath = path.join(contentDir, piece.file);
		const meta = extractMetadata(filePath);

		if (meta) {
			articles.push({
				id: piece.file.replace('.md', ''),
				title: meta.title,
				excerpt: meta.excerpt,
				url: piece.url
			});
			console.log(`✅ ${meta.title}`);
		}
	}

	console.log(`\n✅ Found ${articles.length} articles\n`);

	// Save list
	const outDir = path.join(scriptDir, '../data');
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

	fs.writeFileSync(path.join(outDir, 'articles.json'), JSON.stringify(articles, null, 2));
	console.log('💾 Saved articles.json');
}

main().catch(err => {
	console.error('❌ Error:', err.message);
	process.exit(1);
});
