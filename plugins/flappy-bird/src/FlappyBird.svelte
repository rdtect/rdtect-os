<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

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
  let pipes: Array<{ x: number; gapY: number }> = [];
  const pipeWidth = 50;
  const pipeGap = 120;
  const pipeSpeed = 2;

  // Animation frame ID for cleanup
  let animationId: number | null = null;

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
    const gapY = Math.random() * 150 + 75;
    pipes.push({ x: canvas?.width || 400, gapY });
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
        (birdY < pipe.gapY || birdY + birdSize > pipe.gapY + pipeGap)
      ) {
        endGame();
        return;
      }
    }

    // Draw
    draw();

    // Continue loop
    if (gameRunning) {
      animationId = requestAnimationFrame(gameLoop);
    }
  }

  function endGame() {
    gameRunning = false;
    gameOver = true;
    if (score > highScore) {
      highScore = score;
    }
    draw();
  }

  function draw() {
    if (!ctx || !canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw pipes
    ctx.fillStyle = '#22c55e';
    for (const pipe of pipes) {
      // Top pipe
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.gapY + pipeGap, pipeWidth, height - pipe.gapY - pipeGap);
    }

    // Draw bird
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(birdX + birdSize / 2, birdY + birdSize / 2, birdSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw score
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(score), width / 2, 40);

    // Draw game over or start message
    if (!gameRunning) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';

      if (gameOver) {
        ctx.fillText('Game Over!', width / 2, height / 2 - 30);
        ctx.font = '16px sans-serif';
        ctx.fillText(`Score: ${score}`, width / 2, height / 2);
        ctx.fillText(`High Score: ${highScore}`, width / 2, height / 2 + 25);
        ctx.fillStyle = '#6366f1';
        ctx.fillText('Click or press Space to restart', width / 2, height / 2 + 60);
      } else {
        ctx.fillText('Flappy Bird', width / 2, height / 2 - 20);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#6366f1';
        ctx.fillText('Click or press Space to start', width / 2, height / 2 + 20);
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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    border-radius: 8px;
    border: 1px solid #334155;
    cursor: pointer;
  }

  canvas {
    max-width: 100%;
    max-height: 100%;
    border-radius: 4px;
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
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
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
