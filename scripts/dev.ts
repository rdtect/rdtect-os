import { spawn, $ } from 'bun';

async function main() {
  console.log('🚀 Starting Desktop OS development environment...\n');

  // Start Python backend via Docker (background)
  console.log('📦 Starting Python backend...');
  const pythonProc = spawn({
    cmd: ['docker-compose', 'up', '-d', 'python-backend'],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  await pythonProc.exited;

  // Start the main desktop host
  console.log('\n🖥️  Starting Desktop Host on http://localhost:5173...');
  const hostProc = spawn({
    cmd: ['bun', 'run', 'dev'],
    cwd: './apps/desktop-host',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down...');
    hostProc.kill();
    await $`docker-compose down`;
    process.exit(0);
  });

  await hostProc.exited;
}

main().catch(console.error);
