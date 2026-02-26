<script lang="ts">
	interface Props {
		windowId?: string;
	}

	let { windowId }: Props = $props();

	const PALETTES: Record<string, string[]> = {
		indigo: ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd'],
		neon: ['#00ff87', '#60efff', '#ff6b9d', '#c084fc'],
		sunset: ['#f97316', '#ef4444', '#ec4899', '#a855f7'],
		ocean: ['#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6']
	};

	let blobCount = $state(4);
	let speed = $state(1);
	let amplitude = $state(80);
	let palette = $state<keyof typeof PALETTES>('indigo');
	let showControls = $state(true);

	let canvas: HTMLCanvasElement | undefined = $state();
	let containerEl: HTMLDivElement | undefined = $state();
	let mouseX = $state(0);
	let mouseY = $state(0);
	let animFrame = $state(0);

	interface Blob {
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		phase: number;
	}

	let blobs = $state<Blob[]>([]);

	function initBlobs(count: number, w: number, h: number) {
		blobs = Array.from({ length: count }, (_, i) => ({
			x: w * 0.2 + Math.random() * w * 0.6,
			y: h * 0.2 + Math.random() * h * 0.6,
			vx: (Math.random() - 0.5) * 2,
			vy: (Math.random() - 0.5) * 2,
			radius: 60 + Math.random() * 40,
			phase: (i / count) * Math.PI * 2
		}));
	}

	function exportPNG() {
		if (!canvas) return;
		const link = document.createElement('a');
		link.download = `blob-lab-${Date.now()}.png`;
		link.href = canvas.toDataURL('image/png');
		link.click();
	}

	$effect(() => {
		if (!canvas || !containerEl) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const ro = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			canvas!.width = width * devicePixelRatio;
			canvas!.height = height * devicePixelRatio;
			canvas!.style.width = `${width}px`;
			canvas!.style.height = `${height}px`;
			ctx.scale(devicePixelRatio, devicePixelRatio);
			if (blobs.length === 0 || blobs.length !== blobCount) {
				initBlobs(blobCount, width, height);
			}
		});
		ro.observe(containerEl);

		let raf: number;
		let time = 0;

		function render() {
			if (!canvas || !ctx) return;

			const w = canvas.width / devicePixelRatio;
			const h = canvas.height / devicePixelRatio;
			time += 0.016 * speed;

			// Dark background with gradient
			const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
			bgGrad.addColorStop(0, '#0f1729');
			bgGrad.addColorStop(1, '#060610');
			ctx.fillStyle = bgGrad;
			ctx.fillRect(0, 0, w, h);

			// Update blob positions
			const currentBlobs = blobs.slice(0, blobCount);
			for (const blob of currentBlobs) {
				blob.x += blob.vx * speed;
				blob.y += blob.vy * speed;

				// Mouse influence
				const dx = mouseX - blob.x;
				const dy = mouseY - blob.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < 200 && dist > 0) {
					const force = (200 - dist) / 200 * 0.3;
					blob.vx += (dx / dist) * force;
					blob.vy += (dy / dist) * force;
				}

				// Dampen velocity
				blob.vx *= 0.99;
				blob.vy *= 0.99;

				// Bounce off edges
				if (blob.x < blob.radius) { blob.x = blob.radius; blob.vx *= -0.8; }
				if (blob.x > w - blob.radius) { blob.x = w - blob.radius; blob.vx *= -0.8; }
				if (blob.y < blob.radius) { blob.y = blob.radius; blob.vy *= -0.8; }
				if (blob.y > h - blob.radius) { blob.y = h - blob.radius; blob.vy *= -0.8; }
			}

			// Render metaball field
			const colors = PALETTES[palette];
			const imgData = ctx.createImageData(Math.ceil(w), Math.ceil(h));
			const data = imgData.data;
			const step = 3; // sample every 3rd pixel for performance

			for (let py = 0; py < h; py += step) {
				for (let px = 0; px < w; px += step) {
					let sum = 0;
					let closestIdx = 0;
					let closestVal = 0;

					for (let i = 0; i < currentBlobs.length; i++) {
						const blob = currentBlobs[i];
						const r = blob.radius + Math.sin(time * 2 + blob.phase) * amplitude * 0.3;
						const ddx = px - blob.x;
						const ddy = py - blob.y;
						const d2 = ddx * ddx + ddy * ddy;
						const val = (r * r) / d2;
						sum += val;
						if (val > closestVal) {
							closestVal = val;
							closestIdx = i;
						}
					}

					if (sum > 1) {
						const hex = colors[closestIdx % colors.length];
						const r = parseInt(hex.slice(1, 3), 16);
						const g = parseInt(hex.slice(3, 5), 16);
						const b = parseInt(hex.slice(5, 7), 16);
						const alpha = Math.min(1, (sum - 1) * 2) * 0.85;

						for (let sy = 0; sy < step && py + sy < h; sy++) {
							for (let sx = 0; sx < step && px + sx < w; sx++) {
								const idx = ((py + sy) * Math.ceil(w) + (px + sx)) * 4;
								data[idx] = r;
								data[idx + 1] = g;
								data[idx + 2] = b;
								data[idx + 3] = alpha * 255;
							}
						}
					}
				}
			}

			ctx.putImageData(imgData, 0, 0);

			// Glow overlay for each blob center
			for (let i = 0; i < currentBlobs.length; i++) {
				const blob = currentBlobs[i];
				const color = colors[i % colors.length];
				const glowR = blob.radius * 0.6;
				const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, glowR);
				grad.addColorStop(0, color + '30');
				grad.addColorStop(1, color + '00');
				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.arc(blob.x, blob.y, glowR, 0, Math.PI * 2);
				ctx.fill();
			}

			raf = requestAnimationFrame(render);
		}

		raf = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});

	// Reinit blobs when count changes
	$effect(() => {
		if (canvas && containerEl) {
			const w = containerEl.clientWidth;
			const h = containerEl.clientHeight;
			if (blobs.length !== blobCount) {
				initBlobs(blobCount, w, h);
			}
		}
	});

	function handleMouseMove(e: MouseEvent) {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}
</script>

<div
	class="blob-root"
	bind:this={containerEl}
	onmousemove={handleMouseMove}
>
	<canvas bind:this={canvas}></canvas>

	{#if showControls}
		<div class="controls">
			<div class="control-header">
				<span>Controls</span>
				<button class="toggle-btn" onclick={() => showControls = false}>-</button>
			</div>

			<label class="control-row">
				<span>Blobs</span>
				<input type="range" min="2" max="6" bind:value={blobCount} />
				<span class="val">{blobCount}</span>
			</label>

			<label class="control-row">
				<span>Speed</span>
				<input type="range" min="0.1" max="3" step="0.1" bind:value={speed} />
				<span class="val">{speed.toFixed(1)}</span>
			</label>

			<label class="control-row">
				<span>Amplitude</span>
				<input type="range" min="20" max="150" bind:value={amplitude} />
				<span class="val">{amplitude}</span>
			</label>

			<div class="control-row">
				<span>Palette</span>
				<div class="palette-btns">
					{#each Object.keys(PALETTES) as p}
						<button
							class="palette-btn"
							class:active={palette === p}
							onclick={() => palette = p as keyof typeof PALETTES}
						>
							{#each PALETTES[p].slice(0, 2) as c}
								<span class="swatch" style="background:{c}"></span>
							{/each}
						</button>
					{/each}
				</div>
			</div>

			<button class="export-btn" onclick={exportPNG}>Export PNG</button>
		</div>
	{:else}
		<button class="show-controls-btn" onclick={() => showControls = true}>Controls</button>
	{/if}
</div>

<style>
	.blob-root {
		width: 100%;
		height: 100%;
		position: relative;
		background: #060610;
		overflow: hidden;
		cursor: crosshair;
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
		min-width: 200px;
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
		min-width: 60px;
		font-size: var(--text-xs);
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
		width: 10px;
		height: 10px;
		border-radius: 2px;
	}

	.export-btn {
		width: 100%;
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

	.export-btn:hover {
		background: rgba(99, 102, 241, 0.3);
	}
</style>
