# DEPRECATED — `apps/website` Worker

**This Worker has been deprecated as part of [RDT-580](https://github.com/rdtect/rdtect-os/issues/580).**

## Why?

The `apps/website/` directory contained a SvelteKit app scaffold configured as a **Cloudflare Worker** (`rdtect-website`). This Worker was **never actually deployed** to Cloudflare (verified 2026-07-26 via wrangler API — error 10007: script does not exist).

The directory was redundant with two canonical **Cloudflare Pages** deployments:

| Pages Project | Domain / URL | Content |
|---|---|---|
| `rdtect-os` | `rdtect-os.pages.dev` | Full rdtect OS desktop application (root project) |
| `rdtect-com` | `rdtect.com`, `rdtect-com.pages.dev` | rdtect portfolio site (Rick De — experience design + AI) |

## Canonical Deployments

### rdtect OS (Desktop App)
- **Platform:** Cloudflare Pages
- **Project name:** `rdtect-os`
- **Source:** Root project (`/wrangler.toml`, `/svelte.config.js`, `/src/`)
- **Build output:** `.svelte-kit/cloudflare`
- **Deploy workflow:** `.github/workflows/deploy-pages.yml`

### rdtect.com (Portfolio)
- **Platform:** Cloudflare Pages
- **Project name:** `rdtect-com`
- **Source:** Separate (not from `apps/website/`)
- **Custom domain:** `rdtect.com`

## What was in `apps/website/`

A simple SvelteKit scaffold with a single landing page (`src/routes/+page.svelte`):
> `<h1>rdtect — built on O1</h1>`
> `<p>SvelteKit + Cloudflare Pages. Coming soon.</p>`

This content was never deployed. The Worker route binding (`rdtect.com` → `rdtect-website`) was configured in `wrangler.toml` but was never active because the Worker script was never uploaded.

## What happens next

- ~~The `apps/website/` directory is kept for historical reference~~ **Directory removed 2026-07-26.** All context is preserved in this archived document and `deploy/README.md`.
- The `rdtect-com` Pages project is the canonical deployment for `rdtect.com`.


---

*Last updated: RDT-580 (2026-07-26) — Verified Worker never existed on Cloudflare account*

## Completion Status — RDT-580 ✅

All actionable items for RDT-580 have been completed:

| Item | Status | Evidence |
|------|--------|----------|
| Worker route binding removed | ✅ Done | Routes commented out in `wrangler.toml`; Worker `rdtect-website` never existed on Cloudflare (API error 10007) |
| Directory archived/documented | ✅ Done | This archived document (`docs/archive/rdt-580-deprecated-worker.md`) covers all context |
| Deployment docs updated | ✅ Done | `deploy/README.md` already references retirement |
| CI/CD references removed | ✅ Done | Zero references to `apps/website` in any workflow files |
| Final verification sweep | ✅ Done | Grep'd entire repo for remaining references — only intentional docs remain |
| Directory removed | ✅ Done | `apps/website/` deleted 2026-07-26. This document moved to `docs/archive/`.

### Verification details (heartbeat 2026-07-26)

| Check | Result |
|-------|--------|
| `.github/workflows/` — `deploy.yml`, `deploy-pages.yml`, `ci.yml` | ✅ No references to `apps/website` or `rdtect-website` |
| `wrangler.toml` (root) | ✅ Uses `pages_build_output_dir` — proper Pages config |
| `package.json` (root) workspace pattern `"apps/*"` | ✅ Glob pattern, not specific to `apps/website` |
| `bun.lock` stale entries | ✅ Benign — auto-cleaned on next `bun install` after directory removal |
| `deploy/README.md` | ✅ Already references retirement (line 15) |
| `apps/website/wrangler.toml` | ✅ Routes commented out, header warns DEPRECATED |

---

---

## RDT-584 Post-Review Fixes (2026-07-26)

Productivity review ([RDT-584](https://github.com/rdtect/rdtect-os/issues/584)) identified and resolved two issues:

| Issue | Severity | Fix |
|-------|----------|-----|
| `bun.lock` had stale `apps/website` entries | Low | `bun install` regenerated lockfile; 1 package removed |
| `.serena/project.yml` committed with 3-way merge conflict | Critical | Conflict resolved; kept updated Serena format |

Full review: `docs/plans/rdt-584-productivity-review.md`

---

*Issue: [RDT-580](https://github.com/rdtect/rdtect-os/issues/580) — Deprecate redundant Worker at apps/website*
