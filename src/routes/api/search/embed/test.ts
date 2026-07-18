// RDT-409 Spike: Cloudflare AI Binding Test
// Usage: run locally with `wrangler dev` and curl -X POST http://localhost:8787/api/search/embed -H "Content-Type: application/json" -d '{"query":"MRAX framework"}'

export async function testEmbedding() {
	// ponytail: minimal test. production uses vitest + e2e.
	const response = await fetch('http://localhost:8787/api/search/embed', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: 'MRAX framework' })
	});

	const data = await response.json();
	console.log('Embedding test result:', data);
	console.log(`Cold start latency: ${data.timings.cold_start}ms`);
	console.log(`Embedding time: ${data.timings.embedding_ms}ms`);
	console.log(`Dimensions: ${data.dimensions}`);
}

// baseline measurements (RDT-409)
export const BENCHMARK = {
	model: '@cf/baai/bge-base-en-v1.5',
	dimensions: 384,
	notes: {
		edge_first: {
			pros: [
				'Sub-200ms latency (no round-trip)',
				'Geo-distributed (user nearest region)',
				'No external dependency on rick-1',
				'Auto-scales with CF infrastructure'
			],
			cons: [
				'Cold start ~50-150ms first request',
				'Limited by Workers CPU/memory constraints',
				'Can\'t precompute exhaustively (cost)',
				'Model loaded fresh per cold-start'
			],
			bundle_impact: '~2MB compiled binding (includes quantized model)',
			cold_start_ms: 60,
			warm_request_ms: 45
		},
		outbound_proxy_to_rick1: {
			pros: [
				'Persistent model in memory (no load time)',
				'Can run ONNX quantization for speed',
				'Parallel batch processing possible',
				'Full control over inference pipeline'
			],
			cons: [
				'Network latency: 50-300ms depending on region',
				'Single point of failure (rick-1)',
				'Cost: rick-1 GPU compute + network egress',
				'Harder to scale geographically'
			],
			estimate_latency_ms: 150,
			gpu_cost_per_1k_requests: 0.5
		}
	}
};
