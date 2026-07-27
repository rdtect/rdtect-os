// /insights — Thought-leadership articles sourced from 1_Atlas/personal/brand/content/
// CDO spec: 3_Efforts/rdtect/content/insights-page-spec.md (S300, 2026-08-12)

export interface Insight {
	slug: string;
	title: string;
	excerpt: string;
	readTime: string;
	tags: string[];
	status: 'published' | 'voice-locked' | 'evergreen';
	href: string;         // canonical URL or route path
	publishDate: string;  // display date
}

export const insights: Insight[] = [
	{
		slug: 'architects-natural-ai-leaders',
		title: "Architects Are Natural AI Leaders (And Don't Know It Yet)",
		excerpt: "I didn't change careers three times. Same job, different mediums. Why architects have an unfair advantage in AI — they already see systems, zoom in/out, and orchestrate at multiple scales.",
		readTime: '8 min',
		tags: ['architecture', 'ai-leadership', 'systems-thinking', 'career'],
		status: 'published',
		href: '/writing/2026/07/architects-natural-ai-leaders',
		publishDate: 'July 21, 2026'
	},
	{
		slug: 'think-in-systems-not-prompts',
		title: 'Think in Systems, Not Prompts',
		excerpt: "Nearly every piece of AI advice starts with prompts. That's the wrong starting point. The real skill isn't writing better prompts — it's designing better systems around the AI. And that skill is something architects, PMs, and designers already have.",
		readTime: '6 min',
		tags: ['ai', 'systems-thinking', 'methodology'],
		status: 'voice-locked',
		href: '#',
		publishDate: 'August 2026 (upcoming)'
	},
	{
		slug: 'one-more-prompt-syndrome',
		title: 'The One-More-Prompt Syndrome: Knowing When to Stop',
		excerpt: "Each AI response opens three new threads. Each thread opens three more. Two hours later you're less certain than when you started. This isn't a failure of AI — it's a failure of convergence discipline.",
		readTime: '5 min',
		tags: ['ai', 'discipline', 'decision-making', 'cognitive-overload'],
		status: 'voice-locked',
		href: '#',
		publishDate: 'August 2026 (upcoming)'
	},
	{
		slug: 'double-diamond-ai-mastery',
		title: 'The Double Diamond of AI Mastery',
		excerpt: "The Double Diamond isn't a design process — it's the human-AI collaboration model. AI diverges (generates, explores, ideates). You converge (judge, select, commit). The split is elegant. Most people get it backwards.",
		readTime: '6 min',
		tags: ['ai', 'design-thinking', 'collaboration', 'methodology'],
		status: 'voice-locked',
		href: '#',
		publishDate: 'August 2026 (upcoming)'
	},
	{
		slug: 'ai-is-an-intern',
		title: 'AI Is an Intern, Not a Master',
		excerpt: "AI is a brilliant, tireless, impossibly fast intern who has read the entire internet but has never been to a meeting, never sat with a client, never felt the weight of a decision. Your job is to be the senior partner.",
		readTime: '4 min',
		tags: ['ai', 'philosophy', 'mental-models', 'agency'],
		status: 'published',
		href: '/writing/2026/07/ai-as-intern',
		publishDate: 'July 17, 2026'
	}
];
