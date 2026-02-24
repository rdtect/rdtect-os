<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  let canvas: HTMLCanvasElement;
  let animationId: number;
  let rotation = $state(0);

  // Globe points (simplified world map dots)
  const points: [number, number][] = [];
  // Generate random points on sphere surface representing cities
  for (let i = 0; i < 200; i++) {
    const lat = (Math.random() - 0.5) * Math.PI;
    const lon = Math.random() * Math.PI * 2;
    points.push([lat, lon]);
  }

  // Connection arcs between random point pairs
  const arcs: [number, number][] = [];
  for (let i = 0; i < 15; i++) {
    arcs.push([Math.floor(Math.random() * points.length), Math.floor(Math.random() * points.length)]);
  }

  function project(lat: number, lon: number, r: number, cx: number, cy: number): { x: number; y: number; z: number } {
    const x = r * Math.cos(lat) * Math.sin(lon + rotation);
    const y = r * Math.sin(lat);
    const z = r * Math.cos(lat) * Math.cos(lon + rotation);
    return { x: cx + x, y: cy - y, z };
  }

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.38;

    ctx.clearRect(0, 0, w, h);

    // Globe outline
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Globe fill
    const gradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
    gradient.addColorStop(0, 'rgba(30, 41, 59, 0.8)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw points
    for (const [lat, lon] of points) {
      const p = project(lat, lon, r, cx, cy);
      if (p.z > 0) {
        const alpha = 0.2 + (p.z / r) * 0.6;
        const size = 1 + (p.z / r) * 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.fill();
      }
    }

    // Draw arcs
    for (const [from, to] of arcs) {
      const p1 = project(points[from][0], points[from][1], r, cx, cy);
      const p2 = project(points[to][0], points[to][1], r, cx, cy);
      if (p1.z > 0 && p2.z > 0) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2 - 30;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Meridians
    for (let i = 0; i < 6; i++) {
      const lonOffset = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      let started = false;
      for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += 0.05) {
        const p = project(lat, lonOffset, r, cx, cy);
        if (p.z > 0) {
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          started = false;
        }
      }
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Parallels
    for (let i = 1; i < 6; i++) {
      const latOffset = ((i / 6) - 0.5) * Math.PI;
      ctx.beginPath();
      let started = false;
      for (let lon = 0; lon <= Math.PI * 2; lon += 0.05) {
        const p = project(latOffset, lon, r, cx, cy);
        if (p.z > 0) {
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          started = false;
        }
      }
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.04)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    rotation += 0.003;
    animationId = requestAnimationFrame(draw);
  }

  onMount(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  });
</script>

<div class="globe-container">
  <canvas bind:this={canvas} class="globe-canvas"></canvas>
</div>

<style>
  .globe-container {
    width: 100%;
    height: 100%;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .globe-canvas {
    width: 100%;
    height: 100%;
  }
</style>
