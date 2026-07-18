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
	},
	{
		id: 'ai-as-intern',
		title: 'AI is an Intern, Not a Master',
		excerpt: 'Long-form piece on AI as a force multiplier, not a replacement. Explore how domain expertise combined with AI capability creates true leverage.',
		url: '/writing/2026/07/ai-as-intern',
		content: `# AI is an Intern, Not a Master

The mistake isn't that people use AI too much. It's that they treat it wrong. They talk to it like an oracle: ask a question, take the answer as gospel. Or throw prompts at it without knowing what they're doing, hoping it figures it out. Then they're shocked when it hallucinates—as if the model, not the human, is supposed to know.

Here's the reframe: AI is an intern, not a master. Brilliant. Fast. Not the boss.

## Two Traps

### Trap #1: AI as Oracle

You ask, "Should we pivot to AI?" and your model writes back a 2,000-word strategic plan. You read it once and move to the next thing. That's oracle thinking. And it ends badly.

The model doesn't know your market. Doesn't know your constraints. Doesn't know which decisions have killed companies. It synthesizes training data, but synthesis isn't strategy. Strategy is judgment. That comes from you.

### Trap #2: Domain Ignorance

Throw AI at a domain you don't understand and expect it to fill the gap. It won't. A founder with no spatial design background asks an AI to design a restaurant. The output looks professional. It misses the kitchen sightline. Misses the acoustic dead spot that kills conversation. Misses the code that just changed.

## The Real Bottleneck

Here's what people miss: information isn't scarce anymore. Wisdom is.

Your AI can research anything in seconds. Synthesize datasets. Generate 100 variations on an idea. Done. The hard part is knowing which of those 100 matters.

Wisdom is yours. Speed is theirs.

## The Framework

Domain Knowledge (yours) × AI Capability (theirs) = Leverage

Without domain knowledge: 0 × ∞ = 0
Without AI: ∞ × 0 = still slow
With both: real × fast = wisdom at scale

## How This Works in Practice

Claude Code is the thinking partner. Architects solutions, spots errors, explores 50 options in the time I'd think through two. Agents are specialists. Research, review, draft, analyze—faster than I can alone. But I review their work before it ships. They never make architecture decisions without me.

The vault is wisdom, not information. Every entry is distilled, linked, positioned. When I ask an agent to consult it, they're not searching—they're referencing judgment that already proved true.

## The Proof

My father applies this to physics. He has 45 years of domain expertise in automotive engineering. When we built RapidAI—a system to predict engine performance—we didn't ask the model to invent new physics. We encoded 263 physics rules based on his judgment. That's the intern model. The physicist directs. The machine executes.

At scale, it's orchestration. I run 20 AI agents. Each is a specialist. Some research, some review, some draft, some critique. But the direction is mine. The trade-offs are mine. The architecture is mine. The agents are fast. I'm the domain expert. Together, we're unstoppable.`
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
