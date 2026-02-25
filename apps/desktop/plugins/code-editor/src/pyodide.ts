/**
 * Pyodide wrapper for Python execution in the browser
 * Uses Pyodide CDN to load Python WASM runtime
 */

// Types for Pyodide
interface PyodideInterface {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (packages: string | string[]) => Promise<void>;
  loadPackagesFromImports: (code: string) => Promise<void>;
  setStdout: (options: { batched: (msg: string) => void }) => void;
  setStderr: (options: { batched: (msg: string) => void }) => void;
  globals: Map<string, unknown>;
}

declare global {
  interface Window {
    loadPyodide: (config?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
}

// Pyodide CDN URL
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/';
const PYODIDE_SCRIPT_URL = `${PYODIDE_CDN}pyodide.js`;

// Singleton instance
let pyodideInstance: PyodideInterface | null = null;
let loadingPromise: Promise<PyodideInterface> | null = null;

// Output collectors
let stdoutBuffer: string[] = [];
let stderrBuffer: string[] = [];

/**
 * Result of Python code execution
 */
export interface PyodideResult {
  success: boolean;
  stdout: string;
  stderr: string;
  result: unknown;
  error?: string;
  executionTime: number;
}

/**
 * Load the Pyodide script from CDN
 */
function loadPyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window.loadPyodide === 'function') {
      resolve();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector(`script[src="${PYODIDE_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Pyodide script')));
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = PYODIDE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Pyodide script'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize Pyodide runtime
 */
export async function initPyodide(
  onProgress?: (message: string) => void
): Promise<PyodideInterface> {
  // Return existing instance if available
  if (pyodideInstance) {
    return pyodideInstance;
  }

  // Return existing loading promise if in progress
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      onProgress?.('Loading Pyodide script...');
      await loadPyodideScript();

      onProgress?.('Initializing Python runtime...');
      const pyodide = await window.loadPyodide({
        indexURL: PYODIDE_CDN
      });

      // Configure stdout/stderr capture
      pyodide.setStdout({
        batched: (msg: string) => {
          stdoutBuffer.push(msg);
        }
      });

      pyodide.setStderr({
        batched: (msg: string) => {
          stderrBuffer.push(msg);
        }
      });

      onProgress?.('Python runtime ready!');
      pyodideInstance = pyodide;
      return pyodide;
    } catch (error) {
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Check if Pyodide is initialized
 */
export function isPyodideReady(): boolean {
  return pyodideInstance !== null;
}

/**
 * Get the Pyodide instance
 */
export function getPyodide(): PyodideInterface | null {
  return pyodideInstance;
}

/**
 * Run Python code and capture output
 */
export async function runPython(code: string): Promise<PyodideResult> {
  const startTime = performance.now();

  // Clear output buffers
  stdoutBuffer = [];
  stderrBuffer = [];

  // Ensure Pyodide is initialized
  if (!pyodideInstance) {
    return {
      success: false,
      stdout: '',
      stderr: '',
      result: null,
      error: 'Pyodide is not initialized. Please wait for it to load.',
      executionTime: 0
    };
  }

  try {
    // Auto-load packages from imports
    await pyodideInstance.loadPackagesFromImports(code);

    // Run the code
    const result = await pyodideInstance.runPythonAsync(code);

    const executionTime = performance.now() - startTime;

    return {
      success: true,
      stdout: stdoutBuffer.join('\n'),
      stderr: stderrBuffer.join('\n'),
      result,
      executionTime
    };
  } catch (error) {
    const executionTime = performance.now() - startTime;

    return {
      success: false,
      stdout: stdoutBuffer.join('\n'),
      stderr: stderrBuffer.join('\n'),
      result: null,
      error: error instanceof Error ? error.message : String(error),
      executionTime
    };
  }
}

/**
 * Install a Python package using micropip
 */
export async function installPackage(packageName: string): Promise<{ success: boolean; error?: string }> {
  if (!pyodideInstance) {
    return {
      success: false,
      error: 'Pyodide is not initialized'
    };
  }

  try {
    // First, ensure micropip is loaded
    await pyodideInstance.loadPackage('micropip');

    // Install the package
    await pyodideInstance.runPythonAsync(`
import micropip
await micropip.install('${packageName}')
`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Reset the Python runtime (clear global variables)
 */
export function resetPyodideGlobals(): void {
  if (pyodideInstance) {
    pyodideInstance.runPython(`
# Clear user-defined variables
import sys
keep = set(dir()) | {'keep', 'sys'}
for name in list(dir()):
    if name not in keep and not name.startswith('_'):
        del sys.modules[__name__].__dict__[name]
`);
  }
}
