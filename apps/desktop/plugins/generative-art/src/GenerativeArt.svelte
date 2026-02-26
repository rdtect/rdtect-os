<script lang="ts">
	interface Props {
		windowId?: string;
	}

	let { windowId }: Props = $props();

	type Algorithm = 'flow-field' | 'circle-packing' | 'subdivision';

	const PALETTES: Record<string, string[]> = {
		indigo: ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#4f46e5'],
		warm: ['#f97316', '#ef4444', '#ec4899', '#a855f7', '#f59e0b'],
		cool: ['#06b6d4', '#3b82f6', '#6366f1', '#22c55e', '#14b8a6'],
		mono: ['#f8fafc', '#cbd5e1', '#94a3b8', '#64748b', '#475569']
	};

	let algorithm = $state<Algorithm>('flow-field');
	let seed = $state(Math.floor(Math.random() * 100000));
	let palette = $state<keyof typeof PALETTES>('indigo');
	let density = $state(50);
	let animating = $state(false);
	let showControls = $state(true);

	let canvas: HTMLCanvasElement | undefined = $state();
	let containerEl: HTMLDivElement | undefined = $state();

	// Seeded PRNG
	function mulberry32(a: number) {
		return function () {
			a |= 0; a = a + 0x6d2b79f5 | 0;
			let t = Math.imul(a ^ a >>> 15, 1 | a);
			t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
			return ((t ^ t >>> 14) >>> 0) / 4294967296;
		};
	}

	// Simplex-ish noise (value noise with smooth interpolation)
	function createNoise(rng: () => number) {
		const SIZE = 256;
		const grid = Array.from({ length: SIZE * SIZE }, () => rng() * Math.PI * 2);

		return (x: number, y: number): number => {
			const xi = Math.floor(x) & (SIZE - 1);
			const yi = Math.floor(y) & (SIZE - 1);
			const xf = x - Math.floor(x);
			const yf = y - Math.floor(y);
			const u = xf * xf * (3 - 2 * xf);
			const v = yf * yf * (3 - 2 * yf);

			const a = grid[yi * SIZE + xi];
			const b = grid[yi * SIZE + ((xi + 1) & (SIZE - 1))];
			const c = grid[((yi + 1) & (SIZE - 1)) * SIZE + xi];
			const d = grid[((yi + 1) & (SIZE - 1)) * SIZE + ((xi + 1) & (SIZE - 1))];

			return a + u * (b - a) + v * (c - a) + u * v * (a - b - c + d);
		};
	}

	function drawFlowField(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number) {
		const noise = createNoise(rng);
		const colors = PALETTES[palette];
		const scale = 0.005 + (100 - density) * 0.001;
		const particleCount = 200 + density * 30;
		const steps = 60 + density;

		ctx.globalAlpha = 0.6;
		ctx.lineWidth = 1;

		for (let i = 0; i < particleCount; i++) {
			let x = rng() * w;
			let y = rng() * h;
			const color = colors[Math.floor(rng() * colors.length)];

			ctx.strokeStyle = color;
			ctx.beginPath();
			ctx.moveTo(x, y);

			for (let s = 0; s < steps; s++) {
				const angle = noise(x * scale, y * scale);
				x += Math.cos(angle) * 2;
				y += Math.sin(angle) * 2;

				if (x < 0 || x > w || y < 0 || y > h) break;
				ctx.lineTo(x, y);
			}

			ctx.stroke();
		}

		ctx.globalAlpha = 1;
	}

	function drawCirclePacking(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number) {
		const colors = PALETTES[palette];
		const maxCircles = 100 + density * 10;
		const maxAttempts = maxCircles * 20;
		const minRadius = 3;
		const maxRadius = 20 + density * 0.5;

		interface Circle { x: number; y: number; r: number; }
		const circles: Circle[] = [];

		for (let attempt = 0; attempt < maxAttempts && circles.length < maxCircles; attempt++) {
			const x = rng() * w;
			const y = rng() * h;
			let r = maxRadius;

			// Shrink to fit
			let valid = true;
			for (const c of circles) {
				const d = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
				const gap = d - c.r;
				if (gap < minRadius) { valid = false; break; }
				r = Math.min(r, gap - 1);
			}

			// Edge check
			r = Math.min(r, x, y, w - x, h - y);

			if (valid && r >= minRadius) {
				circles.push({ x, y, r });
			}
		}

		for (const c of circles) {
			const color = colors[Math.floor(rng() * colors.length)];
			ctx.beginPath();
			ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
			ctx.strokeStyle = color;
			ctx.lineWidth = 1.5;
			ctx.globalAlpha = 0.7;
			ctx.stroke();

			if (c.r > 8) {
				ctx.fillStyle = color;
				ctx.globalAlpha = 0.08;
				ctx.fill();
			}
		}

		ctx.globalAlpha = 1;
	}

	function drawSubdivision(ctx: CanvasRenderingContext2D, w: number, h: number, rng: () => number) {
		const colors = PALETTES[palette];
		const maxDepth = 3 + Math.floor(density / 20);

		interface Rect { x: number; y: number; w: number; h: number; depth: number; }
		const rects: Rect[] = [{ x: 0, y: 0, w, h, depth: 0 }];
		const final: Rect[] = [];

		while (rects.length > 0) {
			const rect = rects.pop()!;
			if (rect.depth >= maxDepth || (rect.w < 30 && rect.h < 30) || (rng() < 0.3 && rect.depth > 1)) {
				final.push(rect);
				continue;
			}

			const horizontal = rect.w > rect.h ? true : rect.h > rect.w ? false : rng() > 0.5;
			const split = 0.3 + rng() * 0.4;

			if (horizontal) {
				const splitX = rect.x + rect.w * split;
				rects.push({ x: rect.x, y: rect.y, w: rect.w * split, h: rect.h, depth: rect.depth + 1 });
				rects.push({ x: splitX, y: rect.y, w: rect.w * (1 - split), h: rect.h, depth: rect.depth + 1 });
			} else {
				const splitY = rect.y + rect.h * split;
				rects.push({ x: rect.x, y: rect.y, w: rect.w, h: rect.h * split, depth: rect.depth + 1 });
				rects.push({ x: rect.x, y: splitY, w: rect.w, h: rect.h * (1 - split), depth: rect.depth + 1 });
			}
		}

		const pad = 2;
		for (const rect of final) {
			const color = colors[Math.floor(rng() * colors.length)];

			if (rng() > 0.4) {
				ctx.fillStyle = color;
				ctx.globalAlpha = 0.1 + rng() * 0.15;
				ctx.fillRect(rect.x + pad, rect.y + pad, rect.w - pad * 2, rect.h - pad * 2);
			}

			ctx.strokeStyle = color;
			ctx.globalAlpha = 0.5 + rng() * 0.3;
			ctx.lineWidth = 1;
			ctx.strokeRect(rect.x + pad, rect.y + pad, rect.w - pad * 2, rect.h - pad * 2);
		}

		ctx.globalAlpha = 1;
	}

	function generate() {
		if (!canvas || !containerEl) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const w = containerEl.clientWidth;
		const h = containerEl.clientHeight;
		canvas.width = w * devicePixelRatio;
		canvas.height = h * devicePixelRatio;
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

		// Background
		ctx.fillStyle = '#0a0a14';
		ctx.fillRect(0, 0, w, h);

		const rng = mulberry32(seed);

		switch (algorithm) {
			case 'flow-field': drawFlowField(ctx, w, h, rng); break;
			case 'circle-packing': drawCirclePacking(ctx, w, h, rng); break;
			case 'subdivision': drawSubdivision(ctx, w, h, rng); break;
		}
	}

	function randomize() {
		seed = Math.floor(Math.random() * 100000);
	}

	function exportPNG() {
		if (!canvas) return;
		const link = document.createElement('a');
		link.download = `generative-${algorithm}-${seed}.png`;
		link.href = canvas.toDataURL('image/png');
		link.click();
	}

	// Generate on param change
	$effect(() => {
		// Access reactive deps
		void algorithm;
		void seed;
		void palette;
		void density;
		generate();
	});

	// Auto-animate mode
	$effect(() => {
		if (!animating) return;
		const interval = setInterval(() => {
			seed = Math.floor(Math.random() * 100000);
		}, 2000);
		return () => clearInterval(interval);
	});

	// Initial size
	$effect(() => {
		if (!containerEl) return;
		const ro = new ResizeObserver(() => generate());
		ro.observe(containerEl);
		return () => ro.disconnect();
	});
</script>

<div class="art-root" bind:this={containerEl}>
	<canvas bind:this={canvas}></canvas>

	{#if showControls}
		<div class="controls">
			<div class="control-header">
				<span>Generative Art</span>
				<button class="toggle-btn" onclick={() => showControls = false}>-</button>
			</div>

			<div class="control-row">
				<span>Algorithm</span>
				<select bind:value={algorithm}>
					<option value="flow-field">Flow Field</option>
					<option value="circle-packing">Circle Packing</option>
					<option value="subdivision">Subdivision</option>
				</select>
			</div>

			<div class="control-row">
				<span>Seed</span>
				<span class="seed-val">{seed}</span>
				<button class="small-btn" onclick={randomize}>Randomize</button>
			</div>

			<div class="control-row">
				<span>Palette</span>
				<div class="palette-btns">
					{#each Object.keys(PALETTES) as p}
						<button
							class="palette-btn"
							class:active={palette === p}
							onclick={() => palette = p as keyof typeof PALETTES}
						>
							{#each PALETTES[p].slice(0, 3) as c}
								<span class="swatch" style="background:{c}"></span>
							{/each}
						</button>
					{/each}
				</div>
			</div>

			<label class="control-row">
				<span>Density</span>
				<input type="range" min="10" max="100" bind:value={density} />
				<span class="val">{density}</span>
			</label>

			<div class="control-actions">
				<button class="action-btn" class:active={animating} onclick={() => animating = !animating}>
					{animating ? 'Stop' : 'Animate'}
				</button>
				<button class="action-btn" onclick={exportPNG}>Export PNG</button>
			</div>
		</div>
	{:else}
		<button class="show-controls-btn" onclick={() => showControls = true}>Controls</button>
	{/if}
</div>

<style>
	.art-root {
		width: 100%;
		height: 100%;
		position: relative;
		background: #0a0a14;
		overflow: hidden;
	}

	canvas {
		position: absolute;
		inset: 0;
	}

	.controls {
		position: absolute;
		top: 12px;
		right: 12px;
		background: var(--glass-bg-strong, rgba(30, 41, 59, 0.85));
		backdrop-filter: blur(var(--glass-blur, 16px));
		border: 1px solid rgba(99, 102, 241, 0.15);
		border-radius: var(--radius-lg, 12px);
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 220px;
		z-index: 10;
	}

	.control-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: var(--desktop-font-mono);
		font-size: var(--text-xs);
		color: rgba(99, 102, 241, 0.8);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.toggle-btn, .show-controls-btn {
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: #c4b5fd;
		border-radius: var(--radius-sm, 6px);
		cursor: pointer;
		font-family: var(--desktop-font-mono);
		font-size: var(--text-xs);
	}

	.toggle-btn {
		width: 20px;
		height: 20px;
		padding: 0;
	}

	.show-controls-btn {
		position: absolute;
		top: 12px;
		right: 12px;
		padding: 4px 10px;
		z-index: 10;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: var(--text-xs);
		color: #cbd5e1;
	}

	.control-row span:first-child {
		min-width: 56px;
		font-size: var(--text-xs);
	}

	select {
		flex: 1;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(99, 102, 241, 0.2);
		border-radius: var(--radius-sm, 6px);
		color: #cbd5e1;
		padding: 3px 6px;
		font-size: var(--text-xs);
		font-family: var(--desktop-font-mono);
	}

	.seed-val {
		font-family: var(--desktop-font-mono);
		font-size: var(--text-xs);
		color: #94a3b8;
		flex: 1;
	}

	.small-btn {
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: #c4b5fd;
		border-radius: var(--radius-sm, 6px);
		cursor: pointer;
		font-family: var(--desktop-font-mono);
		font-size: var(--text-xs);
		padding: 2px 8px;
	}

	.small-btn:hover {
		background: rgba(99, 102, 241, 0.25);
	}

	.val {
		min-width: 28px;
		text-align: right;
		font-family: var(--desktop-font-mono);
		font-size: var(--text-xs);
		color: #94a3b8;
	}

	input[type='range'] {
		flex: 1;
		accent-color: #6366f1;
		height: 4px;
	}

	.palette-btns {
		display: flex;
		gap: 4px;
		flex: 1;
		flex-wrap: wrap;
	}

	.palette-btn {
		display: flex;
		gap: 2px;
		padding: 3px 4px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(99, 102, 241, 0.2);
		border-radius: var(--radius-sm, 6px);
		cursor: pointer;
	}

	.palette-btn.active {
		border-color: #6366f1;
		background: rgba(99, 102, 241, 0.15);
	}

	.swatch {
		display: block;
		width: 8px;
		height: 8px;
		border-radius: 2px;
	}

	.control-actions {
		display: flex;
		gap: 6px;
	}

	.action-btn {
		flex: 1;
		padding: 6px;
		background: rgba(99, 102, 241, 0.2);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: var(--radius-sm, 6px);
		color: #c4b5fd;
		cursor: pointer;
		font-family: var(--desktop-font-mono);
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.action-btn:hover {
		background: rgba(99, 102, 241, 0.3);
	}

	.action-btn.active {
		background: rgba(99, 102, 241, 0.4);
		border-color: #6366f1;
	}
</style>
