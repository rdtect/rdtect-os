<script lang="ts">
  import { onMount, tick } from 'svelte';

  // Props from window manager
  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // Terminal output lines
  interface OutputLine {
    text: string;
    type: 'command' | 'output' | 'error' | 'system';
    timestamp: Date;
  }

  // State
  let outputLines = $state<OutputLine[]>([]);
  let currentInput = $state('');
  let commandHistory = $state<string[]>([]);
  let historyIndex = $state(-1);
  let currentDirectory = $state('/home/guest');
  let inputElement: HTMLInputElement;
  let outputContainer: HTMLDivElement;

  // Mock filesystem
  const filesystem: Record<string, { type: 'file' | 'dir'; content?: string; children?: string[] }> = {
    '/': { type: 'dir', children: ['home', 'etc', 'var', 'usr'] },
    '/home': { type: 'dir', children: ['guest'] },
    '/home/guest': { type: 'dir', children: ['documents', 'downloads', 'readme.txt', '.bashrc'] },
    '/home/guest/documents': { type: 'dir', children: ['notes.txt', 'todo.md'] },
    '/home/guest/downloads': { type: 'dir', children: [] },
    '/home/guest/readme.txt': { type: 'file', content: 'Welcome to rdtect OS Terminal!\n\nThis is a simulated terminal environment.\nType "help" to see available commands.' },
    '/home/guest/.bashrc': { type: 'file', content: '# .bashrc\nexport PS1="guest@rdtect-os:~$ "\nexport PATH="/usr/bin:/bin"' },
    '/home/guest/documents/notes.txt': { type: 'file', content: 'My Notes\n========\n- Learn Svelte 5\n- Build awesome apps\n- Have fun coding!' },
    '/home/guest/documents/todo.md': { type: 'file', content: '# Todo List\n\n- [x] Create terminal plugin\n- [ ] Add more commands\n- [ ] World domination' },
    '/etc': { type: 'dir', children: ['hostname', 'passwd'] },
    '/etc/hostname': { type: 'file', content: 'rdtect-os' },
    '/etc/passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nguest:x:1000:1000:Guest User:/home/guest:/bin/bash' },
    '/var': { type: 'dir', children: ['log'] },
    '/var/log': { type: 'dir', children: ['syslog'] },
    '/var/log/syslog': { type: 'file', content: 'Jan 19 12:00:00 rdtect-os kernel: rdtect OS booted successfully\nJan 19 12:00:01 rdtect-os terminal: Session started' },
    '/usr': { type: 'dir', children: ['bin', 'share'] },
    '/usr/bin': { type: 'dir', children: [] },
    '/usr/share': { type: 'dir', children: [] }
  };

  // ASCII art for neofetch
  const neofetchArt = `
        .--.         guest@rdtect-os
       |o_o |        ---------------
       |:_/ |        OS: rdtect OS 1.0
      //   \\ \\       Kernel: WebAssembly
     (|     | )      Shell: svelte-sh
    /'\\_   _/\`\\      Terminal: Terminal.svelte
    \\___)=(___/      Resolution: 1920x1080
                     Theme: Dark Mode
                     CPU: JavaScript V8
                     Memory: Unlimited*
`;

  // Helper to resolve path
  function resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    if (path === '~') {
      return '/home/guest';
    }
    if (path.startsWith('~/')) {
      return '/home/guest' + path.slice(1);
    }
    if (path === '..') {
      const parts = currentDirectory.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/') || '/';
    }
    if (path === '.') {
      return currentDirectory;
    }
    // Handle relative paths with ..
    const parts = currentDirectory.split('/').filter(Boolean);
    for (const segment of path.split('/')) {
      if (segment === '..') {
        parts.pop();
      } else if (segment !== '.') {
        parts.push(segment);
      }
    }
    return '/' + parts.join('/');
  }

  // Add output line
  function addOutput(text: string, type: OutputLine['type'] = 'output') {
    outputLines = [...outputLines, { text, type, timestamp: new Date() }];
  }

  // Clear terminal
  function clearTerminal() {
    outputLines = [];
  }

  // Execute command
  function executeCommand(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add command to history
    commandHistory = [...commandHistory, trimmed];
    historyIndex = -1;

    // Show command with prompt
    addOutput(`guest@rdtect-os:${currentDirectory === '/home/guest' ? '~' : currentDirectory}$ ${trimmed}`, 'command');

    // Parse command
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        addOutput('Available commands:');
        addOutput('  help          - Show this help message');
        addOutput('  echo <text>   - Print text to terminal');
        addOutput('  clear         - Clear the terminal screen');
        addOutput('  date          - Show current date and time');
        addOutput('  whoami        - Show current user');
        addOutput('  pwd           - Print working directory');
        addOutput('  ls [dir]      - List directory contents');
        addOutput('  cd <dir>      - Change directory');
        addOutput('  cat <file>    - Display file contents');
        addOutput('  neofetch      - Display system information');
        addOutput('  history       - Show command history');
        break;

      case 'echo':
        addOutput(args.join(' '));
        break;

      case 'clear':
        clearTerminal();
        break;

      case 'date':
        addOutput(new Date().toString());
        break;

      case 'whoami':
        addOutput('guest');
        break;

      case 'pwd':
        addOutput(currentDirectory);
        break;

      case 'ls': {
        const targetPath = args[0] ? resolvePath(args[0]) : currentDirectory;
        const entry = filesystem[targetPath];
        if (!entry) {
          addOutput(`ls: cannot access '${args[0] || targetPath}': No such file or directory`, 'error');
        } else if (entry.type === 'file') {
          addOutput(targetPath.split('/').pop() || targetPath);
        } else {
          const children = entry.children || [];
          if (children.length === 0) {
            addOutput('(empty directory)');
          } else {
            // Color directories differently
            const formatted = children.map(name => {
              const childPath = targetPath === '/' ? `/${name}` : `${targetPath}/${name}`;
              const child = filesystem[childPath];
              return child?.type === 'dir' ? `${name}/` : name;
            });
            addOutput(formatted.join('  '));
          }
        }
        break;
      }

      case 'cd': {
        if (!args[0] || args[0] === '~') {
          currentDirectory = '/home/guest';
        } else {
          const targetPath = resolvePath(args[0]);
          const entry = filesystem[targetPath];
          if (!entry) {
            addOutput(`cd: ${args[0]}: No such file or directory`, 'error');
          } else if (entry.type !== 'dir') {
            addOutput(`cd: ${args[0]}: Not a directory`, 'error');
          } else {
            currentDirectory = targetPath;
          }
        }
        break;
      }

      case 'cat': {
        if (!args[0]) {
          addOutput('cat: missing operand', 'error');
        } else {
          const targetPath = resolvePath(args[0]);
          const entry = filesystem[targetPath];
          if (!entry) {
            addOutput(`cat: ${args[0]}: No such file or directory`, 'error');
          } else if (entry.type === 'dir') {
            addOutput(`cat: ${args[0]}: Is a directory`, 'error');
          } else {
            (entry.content || '').split('\n').forEach(line => addOutput(line));
          }
        }
        break;
      }

      case 'neofetch':
        neofetchArt.split('\n').forEach(line => addOutput(line, 'system'));
        break;

      case 'history':
        commandHistory.forEach((cmd, i) => {
          addOutput(`  ${(i + 1).toString().padStart(4)}  ${cmd}`);
        });
        break;

      case 'exit':
        addOutput('Goodbye!', 'system');
        addOutput('(Terminal session would close here)', 'system');
        break;

      default:
        addOutput(`${cmd}: command not found. Type 'help' for available commands.`, 'error');
    }
  }

  // Handle key events
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      executeCommand(currentInput);
      currentInput = '';
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (commandHistory.length > 0) {
        if (historyIndex === -1) {
          historyIndex = commandHistory.length - 1;
        } else if (historyIndex > 0) {
          historyIndex--;
        }
        currentInput = commandHistory[historyIndex];
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex !== -1) {
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          currentInput = commandHistory[historyIndex];
        } else {
          historyIndex = -1;
          currentInput = '';
        }
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      clearTerminal();
    }
  }

  // Focus input on click anywhere
  function focusInput() {
    inputElement?.focus();
  }

  // Auto-scroll to bottom when output changes
  $effect(() => {
    if (outputLines.length > 0 && outputContainer) {
      tick().then(() => {
        outputContainer.scrollTop = outputContainer.scrollHeight;
      });
    }
  });

  // Show welcome message and focus input on mount
  onMount(() => {
    addOutput('rdtect OS Terminal v1.0', 'system');
    addOutput('Type "help" for available commands.', 'system');
    addOutput('');
    inputElement?.focus();
  });

  // Format prompt
  const prompt = $derived(`guest@rdtect-os:${currentDirectory === '/home/guest' ? '~' : currentDirectory}$`);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="terminal" onclick={focusInput}>
  <div class="output" bind:this={outputContainer}>
    {#each outputLines as line}
      <div class="line {line.type}">
        <span class="text">{line.text}</span>
      </div>
    {/each}
  </div>
  <div class="input-line">
    <span class="prompt">{prompt}</span>
    <input
      type="text"
      bind:this={inputElement}
      bind:value={currentInput}
      onkeydown={handleKeyDown}
      class="input"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    />
  </div>
</div>

<style>
  .terminal {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #0f172a;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Source Code Pro', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.4;
    color: #f8fafc;
    padding: 8px;
    overflow: hidden;
    cursor: text;
  }

  .output {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 4px;
  }

  .output::-webkit-scrollbar {
    width: 8px;
  }

  .output::-webkit-scrollbar-track {
    background: #1e293b;
  }

  .output::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 4px;
  }

  .output::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }

  .line {
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 1.4em;
  }

  .line.command {
    color: #6366f1;
  }

  .line.output {
    color: #f8fafc;
  }

  .line.error {
    color: #ef4444;
  }

  .line.system {
    color: #8b949e;
  }

  .input-line {
    display: flex;
    align-items: center;
    padding-top: 4px;
    border-top: 1px solid #334155;
  }

  .prompt {
    color: #6366f1;
    white-space: nowrap;
    margin-right: 8px;
  }

  .input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #f8fafc;
    font-family: inherit;
    font-size: inherit;
    caret-color: #6366f1;
  }

  .input::selection {
    background: rgba(99, 102, 241, 0.3);
  }

  /* Blinking cursor effect */
  .input:focus {
    animation: cursor-blink 1s step-end infinite;
  }

  @keyframes cursor-blink {
    50% {
      caret-color: transparent;
    }
  }
</style>
