#!/usr/bin/env node
/**
 * RDT-568: Vault extraction → chunked manifest for DeepSeek baseline
 *
 * Walks ~/Documents/rdtect/{1_Atlas,3_Efforts}/, reads all .md files
 * with frontmatter preserved, chunks into ~50K token pieces,
 * and writes /tmp/deepseek-baseline-output/api-calls-manifest.json
 *
 * Also writes chunking stats for downstream comparison.
 *
 * Run: bun run scripts/extract-vault-manifest.ts
 */

import * as fs from "fs";
import * as path from "path";

const VAULT_ROOT = path.join(require("os").homedir(), "Documents/rdtect");
const DIRS = ["1_Atlas", "3_Efforts"];
const OUTPUT_DIR = "/tmp/deepseek-baseline-output";
const MANIFEST_PATH = path.join(OUTPUT_DIR, "api-calls-manifest.json");
const STATS_PATH = path.join(OUTPUT_DIR, "chunking-stats.json");

// ~50K tokens per chunk, assuming ~4 chars per token
const CHARS_PER_TOKEN_ESTIMATE = 4;
const TARGET_TOKENS_PER_CHUNK = 50_000;
const TARGET_CHARS_PER_CHUNK = TARGET_TOKENS_PER_CHUNK * CHARS_PER_TOKEN_ESTIMATE; // 200K chars

// DeepSeek V4 Pro model config
const MODEL = "deepseek-chat";
const SYSTEM_PROMPT = `You are a knowledge ingestion system analyzing an Obsidian vault. Your task is to read the provided vault content chunks and produce a structured analysis. For each chunk, identify:

1. Key concepts, entities, and their relationships
2. Decision points and rationale
3. Structural patterns (wikilinks, hierarchies, tags)
4. Cross-references between sections

Preserve frontmatter metadata. Output structured JSON with concept map, key entities, relationships, and decision log.`;

interface FileEntry {
  relPath: string;
  content: string;
  charCount: number;
  frontmatter: Record<string, unknown>;
}

interface Chunk {
  files: string[];
  content: string;
  charCount: number;
  estimatedTokens: number;
}

interface ManifestCall {
  call_id: number;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  max_tokens: number;
  estimated_input_tokens: number;
  estimated_total_tokens: number;
}

interface Manifest {
  trial_id: string;
  baseline_model: string;
  total_calls: number;
  vault_source: string;
  vault_dirs: string[];
  timestamp: number;
  calls: ManifestCall[];
}

interface ChunkingStats {
  vault_root: string;
  dirs_scanned: string[];
  total_files: number;
  total_chars: number;
  estimated_total_tokens: number;
  chunks_created: number;
  avg_chunk_tokens: number;
  max_chunk_tokens: number;
  min_chunk_tokens: number;
  files_per_chunk: number[];
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fm: Record<string, unknown> = {};
  const fmLines = match[1].split("\n");
  for (const line of fmLines) {
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (kv) {
      const val = kv[2].trim();
      // Try to parse as array (YAML flow)
      if (val.startsWith("[") && val.endsWith("]")) {
        try {
          fm[kv[1]] = JSON.parse(val.replace(/'/g, '"'));
        } catch {
          fm[kv[1]] = val;
        }
      } else {
        fm[kv[1]] = val;
      }
    }
  }

  return { frontmatter: fm, body: match[2] };
}

function walkDir(dirPath: string, base: string, files: FileEntry[]): void {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    // Skip dotfiles and hidden dirs
    if (entry.name.startsWith(".")) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      walkDir(fullPath, base, files);
    } else if (entry.name.endsWith(".md")) {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const { frontmatter } = parseFrontmatter(raw);

      // Filter out template/empty/trash files
      if (raw.trim().length < 50) continue;
      if (frontmatter.tags && Array.isArray(frontmatter.tags) && frontmatter.tags.includes("template")) continue;
      if (frontmatter.status === "archived") continue;

      files.push({
        relPath,
        content: raw,
        charCount: raw.length,
        frontmatter,
      });
    }
  }
}

function chunkFiles(files: FileEntry[]): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk: FileEntry[] = [];
  let currentChars = 0;

  for (const file of files) {
    // If adding this file would exceed target AND we already have content, start new chunk
    if (currentChars + file.charCount > TARGET_CHARS_PER_CHUNK && currentChunk.length > 0) {
      chunks.push(buildChunk(currentChunk));
      currentChunk = [];
      currentChars = 0;
    }

    currentChunk.push(file);
    currentChars += file.charCount;
  }

  // Flush last chunk
  if (currentChunk.length > 0) {
    chunks.push(buildChunk(currentChunk));
  }

  return chunks;
}

function buildChunk(files: FileEntry[]): Chunk {
  const content = files
    .map(f => `--- FILE: ${f.relPath} ---\n${f.content}`)
    .join("\n\n");

  return {
    files: files.map(f => f.relPath),
    content,
    charCount: content.length,
    estimatedTokens: Math.round(content.length / CHARS_PER_TOKEN_ESTIMATE),
  };
}

function main() {
  console.log("=== RDT-568: Vault Extraction → Manifest Builder ===\n");

  // Step 1: Collect all .md files
  const allFiles: FileEntry[] = [];
  for (const dir of DIRS) {
    const dirPath = path.join(VAULT_ROOT, dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      continue;
    }
    console.log(`Scanning: ${dirPath}`);
    walkDir(dirPath, VAULT_ROOT, allFiles);
  }

  console.log(`\nFound ${allFiles.length} markdown files`);
  const totalChars = allFiles.reduce((s, f) => s + f.charCount, 0);
  const totalTokens = Math.round(totalChars / CHARS_PER_TOKEN_ESTIMATE);
  console.log(`Total: ${totalChars.toLocaleString()} chars (~${totalTokens.toLocaleString()} tokens)`);

  // Step 2: Sort by path for deterministic chunking
  allFiles.sort((a, b) => a.relPath.localeCompare(b.relPath));

  // Step 3: Chunk
  const chunks = chunkFiles(allFiles);
  console.log(`Chunks: ${chunks.length} (target: ~${TARGET_TOKENS_PER_CHUNK.toLocaleString()} tokens each)`);

  // Step 4: Build manifest calls
  const calls: ManifestCall[] = chunks.map((chunk, i) => ({
    call_id: i + 1,
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `## Vault Chunk ${i + 1}/${chunks.length}\n\nAnalyze this section of the vault. Identify key concepts, entities, relationships, and decisions.\n\n${chunk.content}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    estimated_input_tokens: chunk.estimatedTokens,
    estimated_total_tokens: chunk.estimatedTokens + 2000,
  }));

  // Step 5: Write manifest
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest: Manifest = {
    trial_id: "RDT-568-001",
    baseline_model: MODEL,
    total_calls: calls.length,
    vault_source: VAULT_ROOT,
    vault_dirs: DIRS,
    timestamp: Date.now(),
    calls,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✓ Manifest written: ${MANIFEST_PATH}`);
  console.log(`  Calls: ${calls.length}`);
  console.log(`  Total input est: ${calls.reduce((s, c) => s + c.estimated_input_tokens, 0).toLocaleString()} tokens`);

  // Step 6: Write chunking stats
  const fileCounts = chunks.map(c => c.files.length);
  const chunkTokens = chunks.map(c => c.estimatedTokens);

  const stats: ChunkingStats = {
    vault_root: VAULT_ROOT,
    dirs_scanned: DIRS,
    total_files: allFiles.length,
    total_chars: totalChars,
    estimated_total_tokens: totalTokens,
    chunks_created: chunks.length,
    avg_chunk_tokens: Math.round(chunkTokens.reduce((a, b) => a + b, 0) / chunkTokens.length),
    max_chunk_tokens: Math.max(...chunkTokens),
    min_chunk_tokens: Math.min(...chunkTokens),
    files_per_chunk: fileCounts,
  };

  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
  console.log(`✓ Stats written: ${STATS_PATH}`);

  // Summary
  console.log(`\n=== Chunking Summary ===`);
  console.log(`Files:       ${stats.total_files}`);
  console.log(`Chars:       ${stats.total_chars.toLocaleString()}`);
  console.log(`Tokens est:  ${stats.estimated_total_tokens.toLocaleString()}`);
  console.log(`Chunks:      ${stats.chunks_created}`);
  console.log(`Avg/chunk:   ${stats.avg_chunk_tokens.toLocaleString()} tokens`);
  console.log(`Range:       ${stats.min_chunk_tokens.toLocaleString()}–${stats.max_chunk_tokens.toLocaleString()} tokens`);
  console.log(`Files/chunk: ${stats.files_per_chunk.join(", ")}`);
}

main();
