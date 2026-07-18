// RDT-409 Spike: Cloudflare AI Binding Test
// RDT-415: Integration test for search + populate endpoints
// Usage: run locally with `wrangler dev` and call endpoints

export async function testEmbedding() {
	const response = await fetch('http://localhost:8787/api/search/embed', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: 'MRAX framework' })
	});

	const data = await response.json();
	console.log('✓ Embedding:', data);
	return data;
}

export async function testSearch() {
	const response = await fetch('http://localhost:8787/api/search/embed?q=agentic', {
		method: 'GET'
	});
	const data = await response.json();
	console.log('✓ Search results:', data);
	return data;
}

export async function testPopulate() {
	const response = await fetch('http://localhost:8787/api/search/populate', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({})
	});
	const data = await response.json();
	console.log('✓ Population:', data);
	return data;
}

export async function testPopulateStats() {
	const response = await fetch('http://localhost:8787/api/search/populate', {
		method: 'GET'
	});
	const data = await response.json();
	console.log('✓ Stats:', data);
	return data;
}

export const BENCHMARK = {
	model: '@cf/baai/bge-base-en-v1.5',
	dimensions: 384,
	targets: {
		search_latency: '<500ms',
		embedding_latency: '<150ms warm, <200ms cold',
		results_returned: 'top-5 by cosine similarity'
	}
};
