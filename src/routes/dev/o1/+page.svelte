<script lang="ts">
  /**
   * /dev/o1 — O1 Design Library preview harness (development only).
   *
   * Renders every component exported from @rdtect/ui with live variants so
   * the library can be reviewed and exercised without Storybook. The section
   * set is pinned by src/lib/o1/gallery-manifest.ts and guarded by tests:
   *   - gallery-manifest.test.ts  → manifest ⇄ @rdtect/ui exports
   *   - +page.test.ts             → rendered page ⇄ manifest entries
   */
  import {
    Badge,
    Button,
    Card,
    ConfirmDialog,
    Dialog,
    Input,
    Select,
    Toast,
    ToastContainer,
    Toggle,
    Tooltip,
    clearToasts,
    pushToast,
  } from '@rdtect/ui';
  import type {
    BadgeVariant,
    ButtonVariant,
    CardVariant,
    ComponentSize,
    ToggleSize,
    ToastKind,
    TooltipPosition,
  } from '@rdtect/ui';
  import {
    O1_GALLERY,
    O1_GALLERY_COMPONENT_COUNT,
    O1_GALLERY_VARIANT_COUNT,
  } from '$lib/o1/gallery-manifest';

  // ── Static variant lists driving the loops below ──────────────────────
  const BUTTON_VARIANTS: ButtonVariant[] = [
    'primary',
    'secondary',
    'ghost',
    'danger',
    'success',
    'warning',
  ];
  const BUTTON_SIZES: ComponentSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const BADGE_VARIANTS: BadgeVariant[] = [
    'default',
    'accent',
    'success',
    'warning',
    'error',
    'info',
  ];
  const CARD_VARIANTS: CardVariant[] = ['default', 'elevated', 'bordered', 'ghost'];
  const TOOLTIP_POSITIONS: TooltipPosition[] = ['top', 'bottom', 'left', 'right'];
  const TOGGLE_SIZES: ToggleSize[] = ['sm', 'md', 'lg'];

  const THEME_OPTIONS: { value: string; label: string; disabled?: boolean }[] = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'oled', label: 'OLED (coming soon)', disabled: true },
  ];

  const starterSnippet = [
    "import { Button, Input } from '@rdtect/ui';",
    '',
    '<Button>Get started</Button>',
  ].join('\n');

  // ── Interactive demo state ─────────────────────────────────────────────
  let inputValue = $state('Ada Lovelace');
  let passwordValue = $state('correct horse battery staple');
  let languageValue = $state('svelte');
  let themeValue = $state('dark');
  let toggles = $state<Record<ToggleSize, boolean>>({ sm: true, md: false, lg: true });

  let dialogOpen = $state(false);
  let dialogLargeOpen = $state(false);
  let confirmDangerOpen = $state(false);
  let confirmPrimaryOpen = $state(false);

  let standaloneToasts = $state([
    { id: 1, kind: 'info', title: 'Info', message: 'Sync complete — 12 files up to date.' },
    { id: 2, kind: 'success', title: 'Saved', message: 'Changes persisted to disk.' },
    { id: 3, kind: 'warning', title: 'Low disk space', message: 'Only 1.2 GB remaining.' },
    { id: 4, kind: 'error', title: 'Upload failed', message: 'Check your connection and retry.' },
  ] as Array<{
    id: number;
    kind: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
  }>);

  function demoToast(kind: ToastKind, label: string): void {
    pushToast({
      kind,
      title: `${label} notification`,
      message: 'Fired from the O1 preview harness.',
      duration: 2500,
    });
  }

  function dismissStandaloneToast(id: number): void {
    standaloneToasts = standaloneToasts.filter((toast) => toast.id !== id);
  }

  /** Section summary straight from the manifest (keeps copy in one place). */
  function gallerySummary(name: string): string {
    return O1_GALLERY.find((entry) => entry.name === name)?.summary ?? '';
  }

  const LABEL_BY_TOGGLE_SIZE: Record<ToggleSize, string> = {
    sm: 'Small',
    md: 'Medium',
    lg: 'Large',
  };
</script>

<svelte:head>
  <title>O1 Design Library — Preview</title>
  <meta
    name="description"
    content="Development preview harness for the rdtect-os O1 design library."
  />
</svelte:head>

<div class="h-[calc(100vh-3.5rem)] overflow-y-auto bg-desktop-bg text-desktop-text">
  <main class="mx-auto max-w-6xl px-6 py-10 pb-32">
    <!-- ── Page header ─────────────────────────────────────────────── -->
    <header class="rounded-desktop-xl border border-desktop-border bg-desktop-surface p-6">
      <div class="flex flex-wrap items-center gap-3">
        <Badge variant="accent">dev only</Badge>
        <Badge variant="default">O1 design system</Badge>
        <Badge variant="info">{O1_GALLERY_COMPONENT_COUNT} components</Badge>
        <Badge variant="success">{O1_GALLERY_VARIANT_COUNT} variant families</Badge>
      </div>
      <h1 class="mt-4 text-desktop-2xl font-semibold">O1 Design Library — Component Preview</h1>
      <p class="mt-2 max-w-3xl text-desktop-sm text-desktop-text-secondary">
        Every export in <code class="text-desktop-accent">@rdtect/ui</code> is showcased below with
        live, interactive variants. The section set is enforced by
        <code class="text-desktop-accent">src/lib/o1/gallery-manifest.ts</code> — adding a
        component to the library without a gallery section fails the test suite.
      </p>
      <pre
        class="mt-4 overflow-x-auto rounded-desktop-lg border border-desktop-border bg-desktop-bg p-4 font-mono text-desktop-xs text-desktop-text-secondary"
      ><code>{starterSnippet}</code></pre>
      <nav
        aria-label="Gallery sections"
        class="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-desktop-border pt-4"
      >
        {#each O1_GALLERY as entry (entry.id)}
          <a
            href="#{entry.id}"
            class="text-desktop-xs text-desktop-text-secondary transition-colors hover:text-desktop-accent"
          >
            {entry.name}
          </a>
        {/each}
      </nav>
    </header>

    <!-- ── Button ──────────────────────────────────────────────────── -->
    <section id="button" aria-labelledby="h-button" class="mt-10 scroll-mt-6">
      <h2 id="h-button" class="text-desktop-xl font-semibold">Button</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('Button')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <p class="text-desktop-xs font-medium uppercase tracking-wide text-desktop-muted">Variants</p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          {#each BUTTON_VARIANTS as variant (variant)}
            <Button variant={variant}>{variant}</Button>
          {/each}
        </div>
        <p class="mt-6 text-desktop-xs font-medium uppercase tracking-wide text-desktop-muted">
          Sizes
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          {#each BUTTON_SIZES as size (size)}
            <Button size={size}>Size {size}</Button>
          {/each}
        </div>
        <p class="mt-6 text-desktop-xs font-medium uppercase tracking-wide text-desktop-muted">
          Icons, disabled, full width, events
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <Button icon="✨">Leading icon</Button>
          <Button iconRight="→">Trailing icon</Button>
          <Button disabled>Disabled</Button>
          <Button variant="danger" disabled>Disabled danger</Button>
          <Button onclick={() => demoToast('info', 'Button')}>Click me → toast</Button>
        </div>
        <Button fullWidth class="mt-4">Full width</Button>
      </div>
    </section>

    <!-- ── Input ───────────────────────────────────────────────────── -->
    <section id="input" aria-labelledby="h-input" class="mt-10 scroll-mt-6">
      <h2 id="h-input" class="text-desktop-xl font-semibold">Input</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('Input')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <div class="grid gap-6 md:grid-cols-2">
          <Input
            label="Workspace name"
            placeholder="e.g. My Workspace"
            value={inputValue}
            description="Shown in window titles and the taskbar."
            oninput={(e) => (inputValue = (e.currentTarget as HTMLInputElement).value)}
          />
          <Input
            label="Email address"
            type="email"
            icon="✉"
            required
            placeholder="you@example.com"
            error="A valid email address is required."
          />
          <Input
            label="Search plugins"
            icon="🔍"
            placeholder="Search…"
            description="Ghost-free default style with a leading icon."
          />
          <Input
            label="Password"
            type="password"
            value={passwordValue}
            description="Native password masking; value is controlled."
            oninput={(e) => (passwordValue = (e.currentTarget as HTMLInputElement).value)}
          />
          <Input label="Read-only region" value="locked by policy" readonly />
          <Input label="Disabled field" value="not available" disabled />
        </div>
        <Input
          class="mt-6"
          size="lg"
          label="Large input (lg preset)"
          placeholder="Bigger touch target…"
          icon="🖱"
        />
      </div>
    </section>

    <!-- ── Select ──────────────────────────────────────────────────── -->
    <section id="select" aria-labelledby="h-select" class="mt-10 scroll-mt-6">
      <h2 id="h-select" class="text-desktop-xl font-semibold">Select</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('Select')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <div class="grid gap-6 md:grid-cols-2">
          <Select
            label="Favorite language"
            placeholder="Pick a language…"
            options={['Svelte', 'TypeScript', 'Rust', 'Go']}
            value={languageValue}
            description="Stored on the app settings."
            onchange={(e) => (languageValue = (e.currentTarget as HTMLSelectElement).value)}
          />
          <Select
            label="Interface theme"
            placeholder="Choose a theme…"
            options={THEME_OPTIONS}
            value={themeValue}
            description="Object options support disabled entries."
            onchange={(e) => (themeValue = (e.currentTarget as HTMLSelectElement).value)}
          />
          <Select
            label="Country"
            placeholder="Select…"
            required
            options={['United States', 'United Kingdom', 'Germany']}
            error="Country is required to continue."
          />
          <Select
            label="Read-only region"
            disabled
            value="eu-central-1"
            options={['eu-central-1', 'us-west-2']}
            description="Disabled selects still show their value."
          />
        </div>
      </div>
    </section>

    <!-- ── Toggle ──────────────────────────────────────────────────── -->
    <section id="toggle" aria-labelledby="h-toggle" class="mt-10 scroll-mt-6">
      <h2 id="h-toggle" class="text-desktop-xl font-semibold">Toggle</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('Toggle')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <div class="flex flex-wrap gap-x-10 gap-y-6">
          {#each TOGGLE_SIZES as size (size)}
            <Toggle
              label={LABEL_BY_TOGGLE_SIZE[size]}
              size={size}
              checked={toggles[size]}
              onchange={() => (toggles[size] = !toggles[size])}
            />
          {/each}
          <Toggle
            label="Locked (disabled)"
            checked
            disabled
            description="Cannot be changed while locked."
          />
        </div>
        <p class="mt-5 text-desktop-xs text-desktop-muted">
          Bound to local state — clicking a switch updates its own row. Enter/Space activate the
          focused switch.
        </p>
      </div>
    </section>

    <!-- ── Badge ───────────────────────────────────────────────────── -->
    <section id="badge" aria-labelledby="h-badge" class="mt-10 scroll-mt-6">
      <h2 id="h-badge" class="text-desktop-xl font-semibold">Badge</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('Badge')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <p class="text-desktop-xs font-medium uppercase tracking-wide text-desktop-muted">
          Text badges
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          {#each BADGE_VARIANTS as variant (variant)}
            <Badge variant={variant}>{variant}</Badge>
          {/each}
        </div>
        <p class="mt-6 text-desktop-xs font-medium uppercase tracking-wide text-desktop-muted">
          Dot indicators
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-3">
          {#each BADGE_VARIANTS as variant (variant)}
            <Badge variant={variant} dot />
          {/each}
        </div>
      </div>
    </section>

    <!-- ── Card ────────────────────────────────────────────────────── -->
    <section id="card" aria-labelledby="h-card" class="mt-10 scroll-mt-6">
      <h2 id="h-card" class="text-desktop-xl font-semibold">Card</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('Card')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {#each CARD_VARIANTS as variant (variant)}
            <Card
              variant={variant}
              header={`${variant} card`}
              footer="Footer action area"
              class="h-full"
            >
              Body content for the {variant} variant — header and footer are optional string
              regions.
            </Card>
          {/each}
        </div>
        <Card
          variant="elevated"
          header="Interactive card"
          footer="Try keyboard: Tab + Enter"
          class="mt-5 max-w-sm"
          onclick={() => demoToast('info', 'Card')}
        >
          Interactive cards act as buttons (role="button", focusable, Enter activates). Click me —
          or focus me and press Enter.
        </Card>
      </div>
    </section>

    <!-- ── Tooltip ─────────────────────────────────────────────────── -->
    <section id="tooltip" aria-labelledby="h-tooltip" class="mt-10 scroll-mt-6">
      <h2 id="h-tooltip" class="text-desktop-xl font-semibold">Tooltip</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('Tooltip')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <div class="flex flex-wrap gap-x-6 gap-y-8 py-4">
          {#each TOOLTIP_POSITIONS as position (position)}
            <Tooltip text={`Tooltip on the ${position}`} position={position}>
              <span
                class="inline-flex h-10 w-28 items-center justify-center rounded-desktop-md
                  border border-desktop-border bg-desktop-surface text-desktop-sm
                  text-desktop-text-secondary"
              >
                {position}
              </span>
            </Tooltip>
          {/each}
        </div>
        <Tooltip text="Launches the selected app" interactive class="mt-2">
          <Button size="sm" icon="🚀">Interactive trigger</Button>
        </Tooltip>
      </div>
    </section>

    <!-- ── Dialog ──────────────────────────────────────────────────── -->
    <section id="dialog" aria-labelledby="h-dialog" class="mt-10 scroll-mt-6">
      <h2 id="h-dialog" class="text-desktop-xl font-semibold">Dialog</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('Dialog')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <div class="flex flex-wrap gap-3">
          <Button onclick={() => (dialogOpen = true)}>Open O1 dialog</Button>
          <Button variant="secondary" onclick={() => (dialogLargeOpen = true)}>
            Open large O1 dialog
          </Button>
        </div>
        <p class="mt-4 text-desktop-xs text-desktop-muted">
          Try Tab (focus is trapped and restored), Escape, backdrop click and the close X.
        </p>
      </div>

      <Dialog
        open={dialogOpen}
        title="New window"
        description="Dialogs own Escape, backdrop and close-X, trap focus, and restore focus on close."
        onclose={() => (dialogOpen = false)}
      >
        <p class="text-desktop-sm text-desktop-text-secondary">
          This panel is the O1 <code class="text-desktop-text">Dialog</code> at the default md
          size. The close paths never fire the confirm-style action — they only call
          <code class="text-desktop-text">onclose</code>.
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onclick={() => (dialogOpen = false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onclick={() => {
              dialogOpen = false;
              demoToast('success', 'Dialog');
            }}
          >
            OK
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={dialogLargeOpen}
        title="Release notes — v0.2"
        description="Large preset for content-heavy panels."
        size="lg"
        onclose={() => (dialogLargeOpen = false)}
      >
        <ul class="list-disc space-y-1 pl-5 text-desktop-sm text-desktop-text-secondary">
          <li>O1 Dialog with focus trap + restore</li>
          <li>Toast store with auto-dismiss and sticky toasts</li>
          <li>ConfirmDialog danger composition in the shell</li>
        </ul>
        <div class="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onclick={() => (dialogLargeOpen = false)}>
            Close
          </Button>
        </div>
      </Dialog>
    </section>

    <!-- ── ConfirmDialog ───────────────────────────────────────────── -->
    <section id="confirm-dialog" aria-labelledby="h-confirm-dialog" class="mt-10 scroll-mt-6">
      <h2 id="h-confirm-dialog" class="text-desktop-xl font-semibold">ConfirmDialog</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('ConfirmDialog')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <div class="flex flex-wrap gap-3">
          <Button variant="danger" onclick={() => (confirmDangerOpen = true)}>
            Delete draft (demo)
          </Button>
          <Button variant="secondary" onclick={() => (confirmPrimaryOpen = true)}>
            Reset settings (demo)
          </Button>
        </div>
        <p class="mt-4 text-desktop-xs text-desktop-muted">
          Focus lands on the safe button (Cancel / Keep) on open. Confirm fires
          <code class="text-desktop-text">onconfirm</code> then closes; every dismissal path fires
          only <code class="text-desktop-text">onclose</code> — never the action.
        </p>
      </div>

      <ConfirmDialog
        open={confirmDangerOpen}
        title="Delete draft?"
        description="This permanently removes the selected draft. The confirm button uses the danger
          variant; Escape, backdrop, X and Cancel can never trigger it."
        confirmLabel="Delete draft"
        cancelLabel="Keep draft"
        danger
        onconfirm={() =>
          pushToast({
            kind: 'success',
            title: 'Draft deleted',
            message: 'Demo only — nothing was actually removed.',
          })
        }
        onclose={() => (confirmDangerOpen = false)}
      />

      <ConfirmDialog
        open={confirmPrimaryOpen}
        title="Reset workspace settings?"
        description="Restores default layout, icon positions and widget preferences."
        confirmLabel="Reset settings"
        onconfirm={() =>
          pushToast({
            kind: 'info',
            title: 'Settings reset',
            message: 'Demo only — preferences were not changed.',
          })
        }
        onclose={() => (confirmPrimaryOpen = false)}
      />
    </section>

    <!-- ── Toast + ToastContainer ──────────────────────────────────── -->
    <section id="toast" aria-labelledby="h-toast" class="mt-10 scroll-mt-6">
      <h2 id="h-toast" class="text-desktop-xl font-semibold">Toast</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('Toast')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <p class="text-desktop-xs font-medium uppercase tracking-wide text-desktop-muted">
          Standalone cards (custom stacks) — dismiss removes from the local list
        </p>
        <ul class="mt-3 max-w-sm space-y-2">
          {#each standaloneToasts as toast (toast.id)}
            <Toast toast={toast} ondismiss={() => dismissStandaloneToast(toast.id)} />
          {/each}
        </ul>
        {#if standaloneToasts.length === 0}
          <p class="mt-3 text-desktop-xs text-desktop-muted">
            All standalone cards dismissed — reload the page to restore them.
          </p>
        {/if}
      </div>
    </section>

    <section id="toast-container" aria-labelledby="h-toast-container" class="mt-10 scroll-mt-6">
      <h2 id="h-toast-container" class="text-desktop-xl font-semibold">ToastContainer</h2>
      <p class="mt-1 text-desktop-sm text-desktop-text-secondary">
        {gallerySummary('ToastContainer')}
      </p>
      <div class="mt-4 rounded-desktop-lg border border-desktop-border bg-desktop-surface/60 p-5">
        <div class="flex flex-wrap gap-2">
          <Button size="sm" onclick={() => demoToast('info', 'Info')}>Fire info toast</Button>
          <Button size="sm" variant="success" onclick={() => demoToast('success', 'Success')}>
            Fire success toast
          </Button>
          <Button size="sm" variant="warning" onclick={() => demoToast('warning', 'Warning')}>
            Fire warning toast
          </Button>
          <Button size="sm" variant="danger" onclick={() => demoToast('error', 'Error')}>
            Fire error toast
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onclick={() =>
              pushToast({
                kind: 'info',
                title: 'Sticky notification',
                message: 'duration 0 — dismiss me manually or clear the queue.',
                duration: 0,
              })
            }
          >
            Fire sticky toast
          </Button>
          <Button size="sm" variant="ghost" onclick={clearToasts}>
            Clear all toasts
          </Button>
        </div>
        <p class="mt-4 text-desktop-xs text-desktop-muted">
          A single <code class="text-desktop-text">ToastContainer</code> is mounted for this page
          (bottom-right, z-[9999]) and fed by <code class="text-desktop-text">pushToast</code>.
          Toasts auto-dismiss after 2.5s unless duration is 0.
        </p>
      </div>
    </section>
  </main>

  <ToastContainer position="bottom-right" zIndex="z-[9999]" />
</div>
