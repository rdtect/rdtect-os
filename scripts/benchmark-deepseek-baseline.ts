#!/usr/bin/env node
/**
 * DeepSeek V4 Pro vault ingestion baseline (RDT-568 / RDT-535)
 *
 * Reads staged manifest at /tmp/deepseek-baseline-output/api-calls-manifest.json
 * Executes 7 chunked calls (~50K tokens each) against DeepSeek API
 * Captures cost + latency + output quality metrics
 *
 * Requires ONE of:
 *   DEEPSEEK_API_KEY  → direct DeepSeek API (platform.deepseek.com)
 *   OPENROUTER_API_KEY → OpenRouter DeepSeek endpoint (unblocked by RDT-540)
 *
 * Est. cost: ~$0.40 (7 × 50K tokens × $0.435/1M input + $0.87/1M output × ~500 out)
 * Est. time: ~35–70s (7 sequential calls × 5–10s each)
 *
 * Run: DEEPSEEK_API_KEY=sk-... bun run scripts/benchmark-deepseek-baseline.ts
 *  OR: OPENROUTER_API_KEY=sk-or-... bun run scripts/benchmark-deepseek-baseline.ts
 * Output: /tmp/deepseek-baseline-output/results.json + results-summary.md
 */

import * as fs from "fs";
import * as path from "path";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!DEEPSEEK_API_KEY && !OPENROUTER_API_KEY) {
  console.error("ERROR: No API key found.");
  console.error("  Set DEEPSEEK_API_KEY (platform.deepseek.com) OR");
  console.error("  Set OPENROUTER_API_KEY (RDT-540 gate, openrouter.ai).");
  process.exit(1);
}

// ponytail: prefer direct key; fall back to OpenRouter which proxies DeepSeek
const API_KEY = DEEPSEEK_API_KEY ?? OPENROUTER_API_KEY!;
const USING_OPENROUTER = !DEEPSEEK_API_KEY && !!OPENROUTER_API_KEY;
const API_URL = USING_OPENROUTER
  ? "https://openrouter.ai/api/v1/chat/completions"
  : "https://api.deepseek.com/v1/chat/completions";
// OpenRouter model ID for DeepSeek V3/V4 Pro
const OPENROUTER_MODEL = "deepseek/deepseek-chat";

const MANIFEST_PATH = "/tmp/deepseek-baseline-output/api-calls-manifest.json";
const OUTPUT_DIR = "/tmp/deepseek-baseline-output";

// Pricing as of 2026-07 (DeepSeek V4 Pro direct; OpenRouter adds ~5–10% margin)
const PRICE_INPUT_PER_M = 0.435;
const PRICE_OUTPUT_PER_M = 0.87;

interface CallManifest {
  trial_id: string;
  baseline_model: string;
  total_calls: number;
  vault_source: string;
  timestamp: number;
  calls: ApiCall[];
}

interface ApiCall {
  call_id: number;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  max_tokens: number;
  estimated_input_tokens: number;
  estimated_total_tokens: number;
}

interface CallResult {
  call_id: number;
  status: "success" | "error";
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  outputPreview: string; // First 200 chars of output
  error?: string;
  rawOutput?: string;
}

interface BenchmarkSummary {
  trial_id: string;
  model: string;
  timestamp: string;
  totalCalls: number;
  successfulCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUSD: number;
  totalLatencyMs: number;
  avgLatencyPerCallMs: number;
  p95LatencyMs: number;
  qualitySignals: {
    allCallsSucceeded: boolean;
    avgOutputLength: number;
    structureKeywordsFound: string[];
  };
  calls: CallResult[];
}

function calcCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * PRICE_INPUT_PER_M +
         (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M;
}

function p95(latencies: number[]): number {
  const sorted = [...latencies].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
}

async function executeCall(call: ApiCall): Promise<CallResult> {
  const start = Date.now();
  // Use OpenRouter model ID when routing through OpenRouter
  const modelId = USING_OPENROUTER ? OPENROUTER_MODEL : call.model;
  const extraHeaders: Record<string, string> = USING_OPENROUTER
    ? { "HTTP-Referer": "https://rdtect.com", "X-Title": "RDT-535 benchmark" }
    : {};
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: modelId,
        messages: call.messages,
        temperature: call.temperature,
        max_tokens: call.max_tokens,
      }),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      const err = await response.text();
      return {
        call_id: call.call_id,
        status: "error",
        latencyMs,
        inputTokens: 0,
        outputTokens: 0,
        costUSD: 0,
        outputPreview: "",
        error: `HTTP ${response.status}: ${err.slice(0, 200)}`,
      };
    }

    const data = await response.json() as any;
    const inputTokens = data.usage?.prompt_tokens ?? call.estimated_input_tokens;
    const outputTokens = data.usage?.completion_tokens ?? 0;
    const rawOutput = data.choices?.[0]?.message?.content ?? "";

    return {
      call_id: call.call_id,
      status: "success",
      latencyMs,
      inputTokens,
      outputTokens,
      costUSD: calcCost(inputTokens, outputTokens),
      outputPreview: rawOutput.slice(0, 200),
      rawOutput,
    };
  } catch (err) {
    return {
      call_id: call.call_id,
      status: "error",
      latencyMs: Date.now() - start,
      inputTokens: 0,
      outputTokens: 0,
      costUSD: 0,
      outputPreview: "",
      error: String(err),
    };
  }
}

function extractQualitySignals(results: CallResult[]): string[] {
  const keywords = ["concept", "decision", "project", "atlas", "efforts", "standard", "infrastructure"];
  const allOutput = results.map(r => r.rawOutput ?? "").join(" ").toLowerCase();
  return keywords.filter(k => allOutput.includes(k));
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`ERROR: Manifest not found at ${MANIFEST_PATH}`);
    console.error("Re-run vault extraction first.");
    process.exit(1);
  }

  const manifest: CallManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  console.log(`\n=== DeepSeek V4 Pro Baseline — RDT-568 ===`);
  console.log(`Model: ${manifest.baseline_model}${USING_OPENROUTER ? ` (via OpenRouter → ${OPENROUTER_MODEL})` : " (direct)"}`);
  console.log(`Calls: ${manifest.total_calls}`);
  console.log(`Vault: ${manifest.vault_source}`);
  console.log();

  const results: CallResult[] = [];

  for (const call of manifest.calls) {
    process.stdout.write(`Call ${call.call_id}/${manifest.total_calls} (~${call.estimated_input_tokens.toLocaleString()} tokens)... `);
    const result = await executeCall(call);
    results.push(result);

    if (result.status === "success") {
      console.log(`✓ ${result.latencyMs}ms | in:${result.inputTokens} out:${result.outputTokens} | $${result.costUSD.toFixed(4)}`);
    } else {
      console.log(`✗ ERROR: ${result.error}`);
    }
  }

  const successful = results.filter(r => r.status === "success");
  const latencies = successful.map(r => r.latencyMs);

  const summary: BenchmarkSummary = {
    trial_id: manifest.trial_id,
    model: manifest.baseline_model,
    timestamp: new Date().toISOString(),
    totalCalls: manifest.total_calls,
    successfulCalls: successful.length,
    totalInputTokens: successful.reduce((s, r) => s + r.inputTokens, 0),
    totalOutputTokens: successful.reduce((s, r) => s + r.outputTokens, 0),
    totalCostUSD: successful.reduce((s, r) => s + r.costUSD, 0),
    totalLatencyMs: latencies.reduce((s, l) => s + l, 0),
    avgLatencyPerCallMs: latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
    p95LatencyMs: latencies.length ? p95(latencies) : 0,
    qualitySignals: {
      allCallsSucceeded: successful.length === manifest.total_calls,
      avgOutputLength: successful.length ? Math.round(successful.reduce((s, r) => s + (r.rawOutput?.length ?? 0), 0) / successful.length) : 0,
      structureKeywordsFound: extractQualitySignals(successful),
    },
    calls: results,
  };

  // Write results
  const resultsPath = path.join(OUTPUT_DIR, "results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));

  // Write markdown summary for vault
  const apiPath = USING_OPENROUTER ? `OpenRouter (${OPENROUTER_MODEL})` : "Direct DeepSeek API";
  const md = `# DeepSeek V4 Pro Baseline Results — RDT-568

**Trial**: ${summary.trial_id}
**Model**: ${summary.model}
**API path**: ${apiPath}
**Date**: ${summary.timestamp}

## Cost
| Metric | Value |
|--------|-------|
| Total cost | $${summary.totalCostUSD.toFixed(4)} |
| Input tokens | ${summary.totalInputTokens.toLocaleString()} |
| Output tokens | ${summary.totalOutputTokens.toLocaleString()} |

## Latency
| Metric | Value |
|--------|-------|
| Total wall-clock | ${(summary.totalLatencyMs / 1000).toFixed(1)}s |
| Avg per call | ${(summary.avgLatencyPerCallMs / 1000).toFixed(1)}s |
| P95 per call | ${(summary.p95LatencyMs / 1000).toFixed(1)}s |

## Quality Signals
- All calls succeeded: ${summary.qualitySignals.allCallsSucceeded ? "✓" : "✗"} (${summary.successfulCalls}/${summary.totalCalls})
- Keywords found: ${summary.qualitySignals.structureKeywordsFound.join(", ")}
- Avg output length: ${summary.qualitySignals.avgOutputLength} chars

## Call Breakdown
${results.map(r => `- Call ${r.call_id}: ${r.status === "success" ? `✓ ${r.latencyMs}ms, $${r.costUSD.toFixed(4)}` : `✗ ${r.error}`}`).join("\n")}
`;

  const mdPath = path.join(OUTPUT_DIR, "results-summary.md");
  fs.writeFileSync(mdPath, md);

  console.log(`\n=== Summary ===`);
  console.log(`Calls: ${summary.successfulCalls}/${summary.totalCalls} succeeded`);
  console.log(`Cost:  $${summary.totalCostUSD.toFixed(4)}`);
  console.log(`Time:  ${(summary.totalLatencyMs / 1000).toFixed(1)}s total | ${(summary.avgLatencyPerCallMs / 1000).toFixed(1)}s avg/call`);
  console.log(`\n✓ Results: ${resultsPath}`);
  console.log(`✓ Summary: ${mdPath}`);
}

main().catch(err => {
  console.error("Baseline failed:", err);
  process.exit(1);
});
