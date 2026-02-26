<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  const STORAGE_KEY = 'desktop-os-flappy-highscore';

  // Game state
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let gameRunning = $state(false);
  let gameOver = $state(false);
  let score = $state(0);
  let highScore = $state(0);

  // Bird state
  let birdY = $state(150);
  let birdVelocity = $state(0);
  const birdX = 50;
  const birdSize = 20;
  const gravity = 0.5;
  const jumpStrength = -8;

  // Pipe state
  let pipes: Array<{ x: number; gapY: number; gapSize: number }> = [];
  const pipeWidth = 50;
  const basePipeGap = 125;
  const minPipeGap = 85;
  const pipeSpeed = 2;

  // Animation frame ID for cleanup
  let animationId: number | null = null;

  // Difficulty: gap narrows as score increases
  function currentPipeGap(): number {
    const reduction = Math.min(score * 1.5, basePipeGap - minPipeGap);
    return basePipeGap - reduction;
  }

  function loadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) highScore = parseInt(saved, 10) || 0;
    } catch { /* ignore */ }
  }

  function saveHighScore() {
    try {
      localStorage.setItem(STORAGE_KEY, String(highScore));
    } catch { /* ignore */ }
  }

  function startGame() {
    birdY = 150;
    birdVelocity = 0;
    score = 0;
    pipes = [];
    gameOver = false;
    gameRunning = true;
    addPipe();
    gameLoop();
  }

  function addPipe() {
    const gap = currentPipeGap();
    const gapY = Math.random() * 150 + 75;
    pipes.push({ x: canvas?.width || 400, gapY, gapSize: gap });
  }

  function jump() {
    if (!gameRunning && !gameOver) {
      startGame();
      return;
    }
    if (gameOver) {
      startGame();
      return;
    }
    birdVelocity = jumpStrength;
  }

  function gameLoop() {
    if (!ctx || !canvas) return;

    // Update bird position
    birdVelocity += gravity;
    birdY += birdVelocity;

    // Update pipes
    pipes = pipes.map(pipe => ({ ...pipe, x: pipe.x - pipeSpeed }));

    // Remove off-screen pipes and add score
    if (pipes.length > 0 && pipes[0].x + pipeWidth < birdX) {
      pipes.shift();
      score++;
    }

    // Add new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
      addPipe();
    }

    // Check collisions
    const canvasHeight = canvas.height;
    if (birdY < 0 || birdY + birdSize > canvasHeight) {
      endGame();
      return;
    }

    // Check pipe collisions
    for (const pipe of pipes) {
      if (
        birdX + birdSize > pipe.x &&
        birdX < pipe.x + pipeWidth &&
        (birdY < pipe.gapY || birdY + birdSize > pipe.gapY + pipe.gapSize)
      ) {
        endGame();
        return;
      }
    }

    draw();

    if (gameRunning) {
      animationId = requestAnimationFrame(gameLoop);
    }
  }

  function endGame() {
    gameRunning = false;
    gameOver = true;
    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }
    draw();
  }

  function draw() {
    if (!ctx || !canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw pipes with indigo accent + gradient
    for (const pipe of pipes) {
      // Top pipe
      const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
      topGrad.addColorStop(0, '#4f46e5');
      topGrad.addColorStop(1, '#6366f1');
      ctx.fillStyle = topGrad;
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY);
      // Pipe cap
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(pipe.x - 3, pipe.gapY - 8, pipeWidth + 6, 8);

      // Bottom pipe
      const botGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
      botGrad.addColorStop(0, '#4f46e5');
      botGrad.addColorStop(1, '#6366f1');
      ctx.fillStyle = botGrad;
      const botY = pipe.gapY + pipe.gapSize;
      ctx.fillRect(pipe.x, botY, pipeWidth, height - botY);
      // Pipe cap
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(pipe.x - 3, botY, pipeWidth + 6, 8);
    }

    // Draw bird
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(birdX + birdSize / 2, birdY + birdSize / 2, birdSize / 2, 0, Math.PI * 2);
    ctx.fill();
    // Bird eye
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(birdX + birdSize / 2 + 4, birdY + birdSize / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Glass panel score display
    if (gameRunning) {
      const panelW = 80;
      const panelH = 32;
      const panelX = (width - panelW) / 2;
      const panelY = 10;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(score), width / 2, panelY + panelH / 2);
    }

    // Start screen / Game over overlay
    if (!gameRunning) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, width, height);

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      if (gameOver) {
        // Game Over panel
        const pW = 220;
        const pH = 140;
        const pX = (width - pW) / 2;
        const pY = (height - pH) / 2;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.beginPath();
        ctx.roundRect(pX, pY, pW, pH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.fillText('Game Over', width / 2, pY + 28);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '15px system-ui, sans-serif';
        ctx.fillText(`Score: ${score}`, width / 2, pY + 56);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText(`Best: ${highScore}`, width / 2, pY + 78);

        ctx.fillStyle = '#6366f1';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('Click or Space to restart', width / 2, pY + 110);
      } else {
        // Start screen
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText('Flappy Bird', width / 2, height / 2 - 24);

        ctx.fillStyle = '#6366f1';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('Click or Space to start', width / 2, height / 2 + 12);

        if (highScore > 0) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = '12px system-ui, sans-serif';
          ctx.fillText(`Best: ${highScore}`, width / 2, height / 2 + 36);
        }
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.code === 'Space') {
      event.preventDefault();
      jump();
    }
  }

  function handleClick() {
    jump();
  }

  onMount(() => {
    loadHighScore();
    ctx = canvas.getContext('2d');
    if (ctx) {
      draw();
    }
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  });
</script>

<div class="game-container">
  <div class="header">
    <h3>Flappy Bird</h3>
    <div class="stats">
      <span class="score">Score: {score}</span>
      <span class="high-score">Best: {highScore}</span>
    </div>
  </div>

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="canvas-wrapper" onclick={handleClick}>
    <canvas bind:this={canvas} width="400" height="300"></canvas>
  </div>

  <div class="controls">
    {#if !gameRunning}
      <button class="start-btn" onclick={startGame}>
        {gameOver ? 'Play Again' : 'Start Game'}
      </button>
    {:else}
      <button class="jump-btn" onclick={jump}>Jump (Space)</button>
    {/if}
  </div>

  <div class="badge">Canvas Game Plugin</div>
</div>

<style>
  .game-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    font-family: var(--desktop-font-sans);
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid #334155;
    background: #1e293b;
    flex-shrink: 0;
  }

  h3 {
    margin: 0;
    font-size: 14px;
    color: #f1f5f9;
    font-weight: 600;
  }

  .stats {
    display: flex;
    gap: 16px;
    font-size: 12px;
  }

  .score {
    color: #22c55e;
    font-weight: 600;
  }

  .high-score {
    color: #fbbf24;
    font-weight: 600;
  }

  .canvas-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: #1e293b;
    margin: 12px;
    border-radius: var(--radius-md);
    border: 1px solid #334155;
    cursor: pointer;
  }

  canvas {
    max-width: 100%;
    max-height: 100%;
    border-radius: var(--radius-sm);
    display: block;
  }

  .controls {
    padding: 12px;
    display: flex;
    justify-content: center;
    flex-shrink: 0;
  }

  .start-btn,
  .jump-btn {
    background: #6366f1;
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal) var(--transition-easing);
  }

  .start-btn:hover,
  .jump-btn:hover {
    background: #4f46e5;
    transform: scale(1.02);
  }

  .start-btn:active,
  .jump-btn:active {
    transform: scale(0.98);
  }

  .badge {
    text-align: center;
    padding: 8px;
    font-size: 10px;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    flex-shrink: 0;
    border-top: 1px solid #334155;
  }
</style>
