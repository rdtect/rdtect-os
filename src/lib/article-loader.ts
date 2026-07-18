/**
 * Load articles from vault for embedding
 * This is designed to work both in Node and in the browser context
 */

export interface Article {
	id: string;
	title: string;
	excerpt: string;
	url: string;
	content: string;
}

// Hardcoded article list (for MVP)
// In production, this would scan the vault file system
export const ARTICLES: Article[] = [
	{
		id: 'mrax-framework',
		title: 'MRAX Framework',
		excerpt: 'Notice. Engage. Mull. Exchange. The rhythm of architectural thinking that bridges analysis and action.',
		url: '/writing/mrax-framework',
		content: `# MRAX Framework

The MRAX rhythm is the heartbeat of architecture work:

1. **Notice** — Observe patterns, constraints, and forces at play
2. **Engage** — Question assumptions, test boundaries
3. **Mull** — Synthesize, consider trade-offs
4. **Exchange** — Communicate decisions, seek feedback

This cycle repeats at every scale: single function, system boundary, organizational decision.`
	},
	{
		id: 'agentic-organizations',
		title: 'Agentic Organizations',
		excerpt: 'Leverage 10:1 through AI-native team structures, decision frameworks, and capacity models.',
		url: '/writing/agentic-orgs',
		content: `# Agentic Organizations

The 10:1 leverage model: one principal × 10 specialist agents = one organization.

Key principles:
- Agents own domains, not tasks
- Decisions flow from authority rings, not consensus
- Capacity is modeled upfront, not discovered mid-crisis
- Agents have memory; work is async by default`
	},
	{
		id: 'experiential-design',
		title: 'Experiential Design',
		excerpt: 'Workplace experience as a designed system. The DX layer amplifies strategy and enables culture.',
		url: '/writing/experiential-design',
		content: `# Experiential Design (DX)

Design that moves people: spaces, systems, moments.

The DX layer sits between strategy and experience. It's the bridge from "what we want to build" to "how people feel when they use it".

DX is not UI. DX is the rhythm, the pace, the friction, the delight.`
	},
	{
		id: 'thought-leadership',
		title: 'POCs as Thought Leadership',
		excerpt: 'Every proof-of-concept is a thesis. Build to communicate, not to hide.',
		url: '/writing/pocs-as-thought-leadership',
		content: `# POCs as Thought Leadership

A POC without a thesis is just code.

When you build a proof-of-concept:
1. State the bet clearly
2. Design the artifact to prove the bet
3. Share the result with narrative, not just metrics
4. Let the work speak for itself`
	},
	{
		id: 'edge-embeddings',
		title: 'Edge AI for Content Search',
		excerpt: 'Embedding models at the edge: low-latency, user-nearest, cost-effective semantic search.',
		url: '/writing/edge-embeddings',
		content: `# Edge AI for Content Search

Why compute embeddings at the edge?

- **Latency**: 45–150ms vs. 300ms+ from a centralized server
- **Cost**: Included in existing Cloudflare plan, no GPU server needed
- **Resilience**: Search works even if your origin is down
- **Scale**: Auto-scales to global traffic

Trade-off: fixed model set (you don't get to fine-tune). Acceptable for content discovery.`
	}
];

export function getArticles(): Article[] {
	return ARTICLES;
}

export function getArticleById(id: string): Article | undefined {
	return ARTICLES.find(a => a.id === id);
}

export function searchArticles(query: string): Article[] {
	const q = query.toLowerCase();
	return ARTICLES.filter(a =>
		a.title.toLowerCase().includes(q) ||
		a.excerpt.toLowerCase().includes(q) ||
		a.content.toLowerCase().includes(q)
	);
}
