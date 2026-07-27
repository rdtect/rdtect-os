import type { RequestHandler } from '@sveltejs/kit';

const BASE_URL = 'https://rdtect.com';

interface SitemapEntry {
	url: string;
	lastmod?: string;
	changefreq?: string;
	priority?: number;
}

const entries: SitemapEntry[] = [
	{ url: '/', changefreq: 'weekly', priority: 1.0 },
	{ url: '/about', changefreq: 'monthly', priority: 0.8 },
	{ url: '/insights', changefreq: 'weekly', priority: 0.9 },
	{ url: '/case-studies', changefreq: 'monthly', priority: 0.8 },
	{ url: '/experience', changefreq: 'monthly', priority: 0.8 },
	{ url: '/writing', changefreq: 'weekly', priority: 0.9 },
	{ url: '/writing/2026/07/ai-as-intern', changefreq: 'monthly', priority: 0.7, lastmod: '2026-07-17' },
	{ url: '/writing/2026/07/architects-natural-ai-leaders', changefreq: 'monthly', priority: 0.7, lastmod: '2026-07-21' },
	{ url: '/writing/2026/07/content-as-income-engine', changefreq: 'monthly', priority: 0.7, lastmod: '2026-08-18' },
	{ url: '/contact', changefreq: 'monthly', priority: 0.6 },
];

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export const GET: RequestHandler = () => {
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		(e) => `  <url>
    <loc>${escapeXml(BASE_URL + e.url)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ''}${e.priority !== undefined ? `\n    <priority>${e.priority}</priority>` : ''}
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
