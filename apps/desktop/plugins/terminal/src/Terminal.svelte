<script lang="ts">
  import { onMount, tick } from 'svelte';

  interface Props {
    windowId?: string;
  }
  let { windowId }: Props = $props();

  // Terminal output lines — html field enables styled inline content
  interface OutputLine {
    text: string;
    html?: string;
    type: 'command' | 'output' | 'error' | 'system';
    timestamp: Date;
  }

  // State
  let outputLines = $state<OutputLine[]>([]);
  let currentInput = $state('');
  let commandHistory = $state<string[]>([]);
  let historyIndex = $state(-1);
  let currentDirectory = $state('/home/rdtect');
  let inputElement: HTMLInputElement;
  let outputContainer: HTMLDivElement;
  let bootTime = Date.now();

  // Mock filesystem
  const filesystem: Record<string, { type: 'file' | 'dir'; content?: string; children?: string[]; size?: number; modified?: string }> = {
    '/': { type: 'dir', children: ['home', 'etc', 'var', 'usr', 'tmp'] },
    '/home': { type: 'dir', children: ['rdtect'] },
    '/home/rdtect': { type: 'dir', children: ['documents', 'downloads', 'projects', 'readme.txt', '.bashrc', '.config'] },
    '/home/rdtect/documents': { type: 'dir', children: ['notes.txt', 'todo.md'] },
    '/home/rdtect/downloads': { type: 'dir', children: [] },
    '/home/rdtect/projects': { type: 'dir', children: ['desktop-os', 'mrax'] },
    '/home/rdtect/projects/desktop-os': { type: 'dir', children: ['package.json', 'src', 'plugins'] },
    '/home/rdtect/projects/desktop-os/package.json': { type: 'file', content: '{ "name": "desktop-os", "version": "1.0.0" }', size: 42, modified: '2026-02-27' },
    '/home/rdtect/projects/desktop-os/src': { type: 'dir', children: ['app.html', 'routes'] },
    '/home/rdtect/projects/desktop-os/plugins': { type: 'dir', children: ['terminal', 'ai-chat', 'code-editor'] },
    '/home/rdtect/projects/mrax': { type: 'dir', children: ['index.html'] },
    '/home/rdtect/projects/mrax/index.html': { type: 'file', content: '<!DOCTYPE html><html><body>MRAX</body></html>', size: 45, modified: '2026-02-20' },
    '/home/rdtect/readme.txt': { type: 'file', content: 'Welcome to rdtect OS Terminal!\n\nThis is a simulated terminal environment.\nType "help" to see available commands.', size: 98, modified: '2026-02-27' },
    '/home/rdtect/.bashrc': { type: 'file', content: '# .bashrc\nexport PS1="rdtect@desktop-os:~$ "\nexport PATH="/usr/bin:/bin"', size: 72, modified: '2026-01-15' },
    '/home/rdtect/.config': { type: 'dir', children: ['settings.json'] },
    '/home/rdtect/.config/settings.json': { type: 'file', content: '{ "theme": "dark", "font": "JetBrains Mono" }', size: 46, modified: '2026-02-25' },
    '/home/rdtect/documents/notes.txt': { type: 'file', content: 'My Notes\n========\n- Learn Svelte 5\n- Build awesome apps\n- Have fun coding!', size: 68, modified: '2026-02-26' },
    '/home/rdtect/documents/todo.md': { type: 'file', content: '# Todo List\n\n- [x] Create terminal plugin\n- [x] Add more commands\n- [ ] World domination', size: 85, modified: '2026-02-27' },
    '/etc': { type: 'dir', children: ['hostname', 'passwd', 'os-release'] },
    '/etc/hostname': { type: 'file', content: 'desktop-os', size: 10, modified: '2026-01-01' },
    '/etc/passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nrdtect:x:1000:1000:Rick:/home/rdtect:/bin/zsh', size: 78, modified: '2026-01-01' },
    '/etc/os-release': { type: 'file', content: 'NAME="rdtect OS"\nVERSION="2.0"\nID=rdtect\nPRETTY_NAME="rdtect OS 2.0"', size: 72, modified: '2026-02-27' },
    '/var': { type: 'dir', children: ['log'] },
    '/var/log': { type: 'dir', children: ['syslog'] },
    '/var/log/syslog': { type: 'file', content: 'Feb 27 12:00:00 desktop-os kernel: rdtect OS booted successfully\nFeb 27 12:00:01 desktop-os terminal: Session started', size: 115, modified: '2026-02-27' },
    '/usr': { type: 'dir', children: ['bin', 'share'] },
    '/usr/bin': { type: 'dir', children: [] },
    '/usr/share': { type: 'dir', children: [] },
    '/tmp': { type: 'dir', children: [] }
  };

  // All available commands (for tab completion)
  const COMMANDS = ['help', 'echo', 'clear', 'date', 'whoami', 'pwd', 'ls', 'cd', 'cat', 'neofetch', 'history', 'uptime', 'hostname', 'uname', 'touch', 'mkdir', 'rm', 'head', 'wc', 'grep', 'env', 'alias', 'exit'];

  // Neofetch art
  const neofetchArt = [
    '        .--.         \x1b[1mrdtect\x1b[0m@\x1b[36mdesktop-os\x1b[0m',
    '       |o_o |        ───────────────',
    '       |:_/ |        \x1b[1mOS:\x1b[0m rdtect OS 2.0',
    '      //   \\ \\       \x1b[1mKernel:\x1b[0m WebAssembly 1.0',
    '     (|     | )      \x1b[1mShell:\x1b[0m svelte-sh 5.0',
    '    /\'\\_   _/`\\      \x1b[1mTerminal:\x1b[0m Terminal.svelte',
    '    \\___)=(___/      \x1b[1mResolution:\x1b[0m Dynamic',
    '                     \x1b[1mTheme:\x1b[0m Dark Indigo',
    '                     \x1b[1mCPU:\x1b[0m JavaScript V8',
    '                     \x1b[1mMemory:\x1b[0m Unlimited*',
    '                     \x1b[1mUptime:\x1b[0m ' + 'calculating...',
  ];

  // Helper to resolve path
  function resolvePath(path: string): string {
    if (path.startsWith('/')) return normalizePath(path);
    if (path === '~') return '/home/rdtect';
    if (path.startsWith('~/')) return '/home/rdtect' + path.slice(1);

    const parts = currentDirectory.split('/').filter(Boolean);
    for (const segment of path.split('/')) {
      if (segment === '..') parts.pop();
      else if (segment !== '.') parts.push(segment);
    }
    return '/' + parts.join('/') || '/';
  }

  function normalizePath(path: string): string {
    const parts: string[] = [];
    for (const segment of path.split('/').filter(Boolean)) {
      if (segment === '..') parts.pop();
      else if (segment !== '.') parts.push(segment);
    }
    return '/' + parts.join('/') || '/';
  }

  // Add output — supports optional html for colored content
  function addOutput(text: string, type: OutputLine['type'] = 'output', html?: string) {
    outputLines = [...outputLines, { text, html, type, timestamp: new Date() }];
  }

  // Colored output helpers
  function colorize(text: string, color: string): string {
    return `<span style="color:${color}">${escapeHtml(text)}</span>`;
  }

  function bold(text: string): string {
    return `<span style="font-weight:bold">${escapeHtml(text)}</span>`;
  }

  function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function clearTerminal() {
    outputLines = [];
  }

  function getDisplayDir(): string {
    if (currentDirectory === '/home/rdtect') return '~';
    if (currentDirectory.startsWith('/home/rdtect/')) return '~' + currentDirectory.slice(12);
    return currentDirectory;
  }

  function formatUptime(): string {
    const diff = Date.now() - bootTime;
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m ${secs % 60}s`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  }

  // Execute command
  function executeCommand(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;

    commandHistory = [...commandHistory, trimmed];
    historyIndex = -1;

    // Show command with colored prompt
    const promptHtml = `${colorize(`rdtect@desktop-os`, '#4ade80')}:${colorize(getDisplayDir(), '#38bdf8')}$ ${escapeHtml(trimmed)}`;
    addOutput(`rdtect@desktop-os:${getDisplayDir()}$ ${trimmed}`, 'command', promptHtml);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        addOutput('Available commands:', 'output', bold('Available commands:'));
        const cmds = [
          ['help',           'Show this help message'],
          ['echo <text>',    'Print text to terminal'],
          ['clear',          'Clear the terminal screen'],
          ['date',           'Show current date and time'],
          ['whoami',         'Show current user'],
          ['hostname',       'Show hostname'],
          ['uname [-a]',     'Show system information'],
          ['uptime',         'Show system uptime'],
          ['pwd',            'Print working directory'],
          ['ls [-la] [dir]', 'List directory contents'],
          ['cd <dir>',       'Change directory'],
          ['cat <file>',     'Display file contents'],
          ['head <file>',    'Show first lines of file'],
          ['wc <file>',      'Word/line count'],
          ['grep <pat> <f>', 'Search in file'],
          ['touch <file>',   'Create empty file'],
          ['mkdir <dir>',    'Create directory'],
          ['rm <path>',      'Remove file or directory'],
          ['neofetch',       'Display system information'],
          ['history',        'Show command history'],
          ['env',            'Show environment variables'],
          ['exit',           'Close terminal session'],
        ];
        for (const [name, desc] of cmds) {
          const html = `  ${colorize(name.padEnd(18), '#a5b4fc')} ${escapeHtml(desc)}`;
          addOutput(`  ${name.padEnd(18)} ${desc}`, 'output', html);
        }
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
        addOutput('rdtect');
        break;

      case 'hostname':
        addOutput('desktop-os');
        break;

      case 'uname': {
        if (args.includes('-a')) {
          addOutput('rdtect-OS desktop-os 2.0.0-wasm WebAssembly svelte-sh');
        } else {
          addOutput('rdtect-OS');
        }
        break;
      }

      case 'uptime': {
        const up = formatUptime();
        const html = `up ${colorize(up, '#4ade80')}, 1 user, load average: 0.42, 0.38, 0.31`;
        addOutput(`up ${up}, 1 user, load average: 0.42, 0.38, 0.31`, 'output', html);
        break;
      }

      case 'pwd':
        addOutput(currentDirectory);
        break;

      case 'ls': {
        const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
        const pathArg = args.find(a => !a.startsWith('-'));
        const targetPath = pathArg ? resolvePath(pathArg) : currentDirectory;
        const entry = filesystem[targetPath];

        if (!entry) {
          addOutput(`ls: cannot access '${pathArg || targetPath}': No such file or directory`, 'error');
        } else if (entry.type === 'file') {
          if (showLong) {
            const name = targetPath.split('/').pop() || targetPath;
            const size = (entry.size || 0).toString().padStart(6);
            const date = entry.modified || '2026-02-27';
            const html = `-rw-r--r-- 1 rdtect rdtect ${size} ${date} ${escapeHtml(name)}`;
            addOutput(html, 'output', html);
          } else {
            addOutput(targetPath.split('/').pop() || targetPath);
          }
        } else {
          let children = entry.children || [];
          if (showAll) children = ['.', '..', ...children];

          if (children.length === 0) {
            addOutput('(empty directory)');
          } else if (showLong) {
            addOutput(`total ${children.length}`, 'output', colorize(`total ${children.length}`, '#94a3b8'));
            for (const name of children) {
              if (name === '.' || name === '..') {
                const html = `drwxr-xr-x 2 rdtect rdtect      0 2026-02-27 ${colorize(name, '#38bdf8')}`;
                addOutput(`drwxr-xr-x 2 rdtect rdtect      0 2026-02-27 ${name}`, 'output', html);
                continue;
              }
              const childPath = targetPath === '/' ? `/${name}` : `${targetPath}/${name}`;
              const child = filesystem[childPath];
              const isDir = child?.type === 'dir';
              const perm = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
              const size = (child?.size || 0).toString().padStart(6);
              const date = child?.modified || '2026-02-27';
              const displayName = isDir ? `${name}/` : name;
              const coloredName = isDir ? colorize(displayName, '#38bdf8') : escapeHtml(displayName);
              const html = `${perm} 1 rdtect rdtect ${size} ${date} ${coloredName}`;
              addOutput(`${perm} 1 rdtect rdtect ${size} ${date} ${displayName}`, 'output', html);
            }
          } else {
            const htmlParts: string[] = [];
            const textParts: string[] = [];
            for (const name of children) {
              const childPath = targetPath === '/' ? `/${name}` : `${targetPath}/${name}`;
              const child = filesystem[childPath];
              const isDir = child?.type === 'dir';
              textParts.push(isDir ? `${name}/` : name);
              htmlParts.push(isDir ? colorize(`${name}/`, '#38bdf8') : escapeHtml(name));
            }
            addOutput(textParts.join('  '), 'output', htmlParts.join('  '));
          }
        }
        break;
      }

      case 'cd': {
        if (!args[0] || args[0] === '~') {
          currentDirectory = '/home/rdtect';
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

      case 'head': {
        if (!args[0]) {
          addOutput('head: missing operand', 'error');
        } else {
          const targetPath = resolvePath(args[0]);
          const entry = filesystem[targetPath];
          if (!entry) addOutput(`head: ${args[0]}: No such file or directory`, 'error');
          else if (entry.type === 'dir') addOutput(`head: ${args[0]}: Is a directory`, 'error');
          else (entry.content || '').split('\n').slice(0, 10).forEach(line => addOutput(line));
        }
        break;
      }

      case 'wc': {
        if (!args[0]) {
          addOutput('wc: missing operand', 'error');
        } else {
          const targetPath = resolvePath(args[0]);
          const entry = filesystem[targetPath];
          if (!entry) addOutput(`wc: ${args[0]}: No such file or directory`, 'error');
          else if (entry.type === 'dir') addOutput(`wc: ${args[0]}: Is a directory`, 'error');
          else {
            const content = entry.content || '';
            const lines = content.split('\n').length;
            const words = content.split(/\s+/).filter(Boolean).length;
            const chars = content.length;
            addOutput(`  ${lines}  ${words} ${chars} ${args[0]}`);
          }
        }
        break;
      }

      case 'grep': {
        if (args.length < 2) {
          addOutput('Usage: grep <pattern> <file>', 'error');
        } else {
          const pattern = args[0];
          const targetPath = resolvePath(args[1]);
          const entry = filesystem[targetPath];
          if (!entry) addOutput(`grep: ${args[1]}: No such file or directory`, 'error');
          else if (entry.type === 'dir') addOutput(`grep: ${args[1]}: Is a directory`, 'error');
          else {
            const lines = (entry.content || '').split('\n');
            let found = false;
            for (const line of lines) {
              if (line.toLowerCase().includes(pattern.toLowerCase())) {
                const highlighted = line.replace(
                  new RegExp(`(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                  (match) => match
                );
                const html = escapeHtml(line).replace(
                  new RegExp(`(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                  (match) => colorize(match, '#ef4444').replace(escapeHtml(match), `<strong>${escapeHtml(match)}</strong>`)
                );
                addOutput(highlighted, 'output', html);
                found = true;
              }
            }
            if (!found) addOutput('(no matches)', 'system');
          }
        }
        break;
      }

      case 'touch': {
        if (!args[0]) {
          addOutput('touch: missing operand', 'error');
        } else {
          const targetPath = resolvePath(args[0]);
          if (!filesystem[targetPath]) {
            const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
            const parent = filesystem[parentPath];
            if (!parent || parent.type !== 'dir') {
              addOutput(`touch: cannot touch '${args[0]}': No such directory`, 'error');
            } else {
              const name = targetPath.split('/').pop()!;
              filesystem[targetPath] = { type: 'file', content: '', size: 0, modified: new Date().toISOString().split('T')[0] };
              parent.children = [...(parent.children || []), name];
            }
          }
        }
        break;
      }

      case 'mkdir': {
        if (!args[0]) {
          addOutput('mkdir: missing operand', 'error');
        } else {
          const targetPath = resolvePath(args[0]);
          if (filesystem[targetPath]) {
            addOutput(`mkdir: cannot create directory '${args[0]}': File exists`, 'error');
          } else {
            const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
            const parent = filesystem[parentPath];
            if (!parent || parent.type !== 'dir') {
              addOutput(`mkdir: cannot create directory '${args[0]}': No such directory`, 'error');
            } else {
              const name = targetPath.split('/').pop()!;
              filesystem[targetPath] = { type: 'dir', children: [] };
              parent.children = [...(parent.children || []), name];
            }
          }
        }
        break;
      }

      case 'rm': {
        if (!args[0]) {
          addOutput('rm: missing operand', 'error');
        } else {
          const targetPath = resolvePath(args[0]);
          const entry = filesystem[targetPath];
          if (!entry) {
            addOutput(`rm: cannot remove '${args[0]}': No such file or directory`, 'error');
          } else {
            const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
            const parent = filesystem[parentPath];
            if (parent) {
              const name = targetPath.split('/').pop()!;
              parent.children = (parent.children || []).filter(c => c !== name);
            }
            delete filesystem[targetPath];
          }
        }
        break;
      }

      case 'env':
        addOutput('USER=rdtect');
        addOutput('HOME=/home/rdtect');
        addOutput('SHELL=/bin/zsh');
        addOutput('TERM=svelte-terminal');
        addOutput('PATH=/usr/bin:/bin');
        addOutput('LANG=en_US.UTF-8');
        addOutput('EDITOR=code-editor');
        break;

      case 'alias':
        addOutput("ll='ls -la'");
        addOutput("la='ls -a'");
        addOutput("..='cd ..'");
        break;

      case 'neofetch': {
        const up = formatUptime();
        for (const line of neofetchArt) {
          const text = line.replace('calculating...', up);
          addOutput(text, 'system');
        }
        break;
      }

      case 'history':
        commandHistory.forEach((cmd, i) => {
          const num = (i + 1).toString().padStart(4);
          const html = `${colorize(num, '#64748b')}  ${escapeHtml(cmd)}`;
          addOutput(`  ${num}  ${cmd}`, 'output', html);
        });
        break;

      case 'exit':
        addOutput('Goodbye!', 'system');
        addOutput('(Terminal session ended)', 'system');
        break;

      default:
        addOutput(`${cmd}: command not found. Type 'help' for available commands.`, 'error');
    }
  }

  // Tab completion
  function handleTab() {
    const input = currentInput.trim();
    if (!input) return;

    const parts = input.split(/\s+/);

    if (parts.length === 1) {
      // Complete command name
      const prefix = parts[0].toLowerCase();
      const matches = COMMANDS.filter(c => c.startsWith(prefix));
      if (matches.length === 1) {
        currentInput = matches[0] + ' ';
      } else if (matches.length > 1) {
        addOutput(`rdtect@desktop-os:${getDisplayDir()}$ ${input}`, 'command');
        addOutput(matches.join('  '));
      }
    } else {
      // Complete file/directory path
      const pathPrefix = parts[parts.length - 1];
      const resolved = resolvePath(pathPrefix);
      const parentDir = resolved.includes('/') ? resolved.substring(0, resolved.lastIndexOf('/')) || '/' : currentDirectory;
      const namePrefix = resolved.split('/').pop() || '';
      const parent = filesystem[parentDir];

      if (parent?.type === 'dir' && parent.children) {
        const matches = parent.children.filter(c => c.startsWith(namePrefix));
        if (matches.length === 1) {
          const match = matches[0];
          const childPath = parentDir === '/' ? `/${match}` : `${parentDir}/${match}`;
          const isDir = filesystem[childPath]?.type === 'dir';
          // Replace the last part of input with the completed name
          parts[parts.length - 1] = pathPrefix.includes('/')
            ? pathPrefix.substring(0, pathPrefix.lastIndexOf('/') + 1) + match + (isDir ? '/' : '')
            : match + (isDir ? '/' : '');
          currentInput = parts.join(' ');
        } else if (matches.length > 1) {
          addOutput(`rdtect@desktop-os:${getDisplayDir()}$ ${input}`, 'command');
          const htmlParts = matches.map(m => {
            const childPath = parentDir === '/' ? `/${m}` : `${parentDir}/${m}`;
            return filesystem[childPath]?.type === 'dir' ? colorize(m + '/', '#38bdf8') : escapeHtml(m);
          });
          addOutput(matches.join('  '), 'output', htmlParts.join('  '));
        }
      }
    }
  }

  // Handle key events
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      executeCommand(currentInput);
      currentInput = '';
    } else if (event.key === 'Tab') {
      event.preventDefault();
      handleTab();
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
    } else if (event.key === 'c' && event.ctrlKey) {
      event.preventDefault();
      const promptHtml = `${colorize('rdtect@desktop-os', '#4ade80')}:${colorize(getDisplayDir(), '#38bdf8')}$ ${escapeHtml(currentInput)}^C`;
      addOutput(`rdtect@desktop-os:${getDisplayDir()}$ ${currentInput}^C`, 'command', promptHtml);
      currentInput = '';
    }
  }

  function focusInput() {
    inputElement?.focus();
  }

  // Auto-scroll on output change
  $effect(() => {
    if (outputLines.length > 0 && outputContainer) {
      tick().then(() => {
        outputContainer.scrollTop = outputContainer.scrollHeight;
      });
    }
  });

  onMount(() => {
    addOutput('rdtect OS Terminal v2.0', 'system');
    addOutput('Type "help" for available commands. Tab for completion.', 'system');
    addOutput('');
    inputElement?.focus();
  });

  const prompt = $derived(`rdtect@desktop-os:${getDisplayDir()}$`);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="terminal" onclick={focusInput}>
  <div class="output" bind:this={outputContainer}>
    {#each outputLines as line}
      <div class="line {line.type}">
        {#if line.html}
          <span class="text">{@html line.html}</span>
        {:else}
          <span class="text">{line.text}</span>
        {/if}
      </div>
    {/each}
  </div>
  <div class="input-line">
    <span class="prompt">
      <span class="prompt-user">rdtect@desktop-os</span>:<span class="prompt-dir">{getDisplayDir()}</span>$
    </span>
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
    font-family: var(--desktop-font-mono);
    font-size: var(--text-base);
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

  .output::-webkit-scrollbar { width: var(--scrollbar-width); }
  .output::-webkit-scrollbar-track { background: transparent; }
  .output::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: var(--radius-full); }
  .output::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }

  .line {
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 1.4em;
  }

  .line.command { color: #94a3b8; }
  .line.output { color: #f8fafc; }
  .line.error { color: var(--color-error-text); }
  .line.system { color: #94a3b8; }

  .input-line {
    display: flex;
    align-items: center;
    padding-top: 4px;
    border-top: 1px solid #334155;
    min-height: 44px;
  }

  .prompt {
    white-space: nowrap;
    margin-right: 8px;
  }

  .prompt-user { color: #4ade80; font-weight: 600; }
  .prompt-dir { color: #38bdf8; }

  .input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #f8fafc;
    font-family: inherit;
    font-size: inherit;
    caret-color: #4ade80;
  }

  .input::selection { background: rgba(99, 102, 241, 0.3); }

  .input:focus { animation: cursor-blink 1s step-end infinite; }

  @keyframes cursor-blink { 50% { caret-color: transparent; } }

  @media (prefers-reduced-motion: reduce) {
    .input:focus { animation: none; }
  }
</style>
