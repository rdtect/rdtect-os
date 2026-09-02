/**
 * O1 Gallery Manifest — guard tests
 *
 * These keep the /dev/o1 preview harness honest:
 *
 *   1. Every *component* export of `@rdtect/ui` must have a manifest entry,
 *      and every manifest entry must reference a real export. Adding a new
 *      component to the library but forgetting to showcase it fails the
 *      suite with a readable diff.
 *   2. Manifest ids stay unique and anchor-safe, and summaries/variants stay
 *      non-empty, so section anchors on the page can never collide.
 *
 * The page's own smoke test (src/routes/dev/o1/+page.test.ts) then asserts a
 * rendered section per entry, closing the manifest → page gap.
 */
import { describe, it, expect } from 'vitest';
import * as O1 from '@rdtect/ui';
import { O1_GALLERY } from './gallery-manifest';

/**
 * Runtime (non-type) exports of `@rdtect/ui` that are NOT Svelte components:
 * the toast store, its helpers, and the size/const maps from types.ts.
 * Svelte components are exported from index.ts as `export { default as X }`;
 * every other runtime export must be listed here so the guard below can
 * treat the remainder as components the gallery must cover.
 */
const NON_COMPONENT_EXPORTS = new Set([
  'toasts',
  'pushToast',
  'dismissToast',
  'clearToasts',
  'SIZE_MAP',
  'TOGGLE_SIZE_MAP',
]);

describe('O1 gallery manifest', () => {
  it('covers every component export of @rdtect/ui (both directions)', () => {
    const componentExports = Object.keys(O1)
      .filter((key) => !NON_COMPONENT_EXPORTS.has(key))
      .sort();
    const manifestNames = O1_GALLERY.map((entry) => entry.name).sort();

    expect(manifestNames).toEqual(componentExports);
  });

  it('only references exports that exist at runtime', () => {
    for (const entry of O1_GALLERY) {
      expect(O1, `manifest entry "${entry.name}"`).toHaveProperty(entry.name);
    }
  });

  it('keeps ids unique and anchor-safe, summaries and variants non-empty', () => {
    const seenIds = new Set<string>();
    for (const entry of O1_GALLERY) {
      expect(entry.id, `id for "${entry.name}"`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(seenIds.has(entry.id), `duplicate id "${entry.id}"`).toBe(false);
      seenIds.add(entry.id);

      expect(entry.summary.trim().length, `summary for "${entry.name}"`).toBeGreaterThan(0);
      expect(entry.variants.length, `variants for "${entry.name}"`).toBeGreaterThan(0);
      expect(
        new Set(entry.variants).size,
        `duplicate variant chip in "${entry.name}"`
      ).toBe(entry.variants.length);
    }
    expect(O1_GALLERY.length).toBeGreaterThan(0);
  });
});
