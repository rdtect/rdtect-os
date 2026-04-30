# mrax-todo — Architecture

A todo list lab demonstrating the **MRAX trilogy** applied to a Svelte 5 + runes-class codebase. Sister lab to `mrax-tictactoe`. The naming convention matches; the modernity is sharper (full runes, no `$:`, no legacy stores, no `createEventDispatcher`).

The point of this lab is to be a **clean reference** for the patterns Rick has articulated: substrate-vs-lens, class-for-behaviour-functions-for-composing, three universal invariants (immutable per tick / pure transitions / derived views), and the receiver-NEME at component scale.

---

## File layout

```
labs/mrax-todo/
├── ARCHITECTURE.md                  ← this file
├── README.md
├── package.json
├── _legacy/                         ← previous plain-JS implementation (preserved, not built)
│   ├── src/
│   ├── styles/
│   └── index.html
└── svelte-web/
    └── src/
        └── lib/
            ├── index.ts                      ← public exports
            ├── todo.types.ts                 ← Model types (pure)
            ├── todo.logic.ts                 ← Rules + Actions (pure functions)
            ├── todo.effects.ts               ← Boundary (IndexedDB)
            ├── todo.handlers.ts              ← Orchestrators (impure functions)
            ├── todo.model.svelte.ts          ← Reactive store (class with runes)
            ├── TodoApp.svelte                ← Composition root component
            ├── TodoForm.svelte               ← Add-todo input
            ├── TodoItem.svelte               ← Per-row component
            ├── TodoFilters.svelte            ← Filter bar
            └── TodoStats.svelte              ← Stats footer + clear completed
```

---

## MRAX mapping

| Layer | Files | Role |
|---|---|---|
| **Model** | `todo.types.ts`, `todo.model.svelte.ts` | Type definitions + reactive substrate (TodoStore class). Class fields use `$state` for write surface and `$derived` for read surface. Singleton `todoStore` is the shared substrate. |
| **Rules** | `todo.logic.ts` (`isValidTodoText`, transition implications via `toggleStatus`) | Pure validation + invariants. No side effects. Importable from any TS context. |
| **Actions** | `todo.logic.ts` (pure: `createTodo`, `toggleStatus`, `rename`) + `todo.handlers.ts` (impure orchestrators) | Pure transitions for the data layer; orchestrators compose `pure logic + boundary effect + substrate mutation` per user intent. |
| **eXperience** | `TodoApp.svelte`, `TodoForm.svelte`, `TodoItem.svelte`, `TodoFilters.svelte`, `TodoStats.svelte` | UI surfaces. Each component is a fractal MRAX (props=Model, derived=Rules, handlers=Actions, markup=eXperience). |
| **Boundary** | `todo.effects.ts` | IndexedDB wrapped as Pattern-3 (subsystem owner): owned entirely inside this file; rest of app calls `loadAll / save / remove / removeMany`. |

---

## Three universal invariants — applied here

1. **State is immutable per tick.** Every mutation in `TodoStore` reassigns `this.todos` to a new array; no in-place edits. Pure logic functions (`toggleStatus`, `rename`) return new objects.
2. **Transitions are pure functions.** `todo.logic.ts` is fully pure. Side effects (IndexedDB, DOM) live only in `todo.effects.ts` and `*.svelte` components.
3. **Views are derived.** `visible`, `stats`, `hasCompleted`, `isEmpty` are `$derived` — auto-recomputed, never stored.

These three give us ECS, CQRS, Event Sourcing, and Functional Core / Imperative Shell as consequences (not separate patterns).

---

## Class for behaviour, functions for composing

| Pattern | Example here |
|---|---|
| **Class** (state + identity) | `TodoStore` — owns reactive state, exposes minimal mutation API |
| **Functions** (compose, no identity) | `createTodo`, `toggleStatus`, `rename`, `filterTodos`, `sortTodos`, `getStats`, `isValidTodoText`, all `handlers.*`, all `effects.*` |

`todo.logic.ts` is plain functions (no class wrapper). `handlers.*` are functions taking a `ctx` (store + effects). `effects.*` are functions taking inputs and returning Promises. The only class with state is the store.

---

## Substrate vs lens

| Substrate (write side) | Lens (read side) |
|---|---|
| `todoStore.todos` (`$state`) | `todoStore.visible` (`$derived` — filtered + sorted) |
| `todoStore.currentFilter` (`$state`) | `todoStore.stats` (`$derived` — counts) |
| IndexedDB on disk (via `effects.save / remove`) | `loadAll()` materializes substrate into the store on boot |

You write to substrate; lens auto-recomputes. Adding a new view (e.g., `byMonth`, `recentlyCompleted`) is one new `$derived` — never a substrate change.

---

## Receiver-NEME at component scale

Every component is a micro-experience:

- **TodoForm** — Notice (input visible) → Engage (typing) → Mull (Add button feedback) → Exchange (item appears in list, input clears)
- **TodoItem** — Notice (row visible) → Engage (click checkbox / dblclick to edit) → Mull (strikethrough, animation) → Exchange (state persisted, list reflects change)
- **TodoFilters** — Notice (filter buttons + counts) → Engage (click) → Mull (active state, count update) → Exchange (list re-renders to show only that filter)

Each component closes the receiver's loop in <100ms. The story moves forward.

---

## What gets deleted from the legacy implementation

| Legacy file | Replacement | Why |
|---|---|---|
| `src/ui/Renderer.js` | `*.svelte` components | Components ARE the renderer |
| `src/ui/EventHandler.js` | `onclick={...}` attributes | Svelte 5 native event syntax |
| `src/state/TodoState.js` (god class) | `TodoStore` (focused) + `handlers/*` (functions) | Split: state vs orchestration |
| `src/core/TodoLogic.js` (static-method class) | `todo.logic.ts` (plain functions) | JS modules are namespaces |
| `src/services/IndexedDBService.js` | `todo.effects.ts` (functional API) | Pattern-3 isolation, no class needed |
| `src/main.js` | `TodoApp.svelte` (composition root) | Component IS the entry |

Code reduction: ~50%. Behaviour preserved. AI legibility increased dramatically.

---

## Anti-patterns avoided

- Classes wrapping pure functions as static methods (`todo.logic.ts` is plain exports)
- Mutation outside named methods (only the store's API mutates substrate)
- Stored derived views (everything reads through `$derived`)
- Inheritance hierarchies (zero — composition only)
- `$effect` for state derivation (only used at composition root for `load()` boot)
- Library leaking into pure core (IndexedDB sealed inside `todo.effects.ts`)
- Mega-files (each file is one concern, ~50-150 lines)

---

## See also

- `[[../../1_Atlas/notes/engineering/pattern-mrax-as-application-floor-plan]]` — the WHAT
- `[[../../1_Atlas/notes/engineering/pattern-canonical-mrax-code-structure]]` — the HOW
- `[[../../1_Atlas/notes/engineering/pattern-mrax-kickoff-procedure]]` — the START
- `[[../../1_Atlas/notes/engineering/pattern-svelte-mrax-alignment]]` — Svelte 5 idiom mapping
- `[[../../1_Atlas/notes/engineering/pattern-libraries-at-the-boundary]]` — IndexedDB as Pattern-3 isolation
- `[[../../1_Atlas/notes/engineering/pattern-flat-storage-nested-views]]` — substrate-atomic / lens-composed at the data layer
- `[[../../1_Atlas/notes/engineering/case-mrax-teaching-content-tracker]]` — sister case study
