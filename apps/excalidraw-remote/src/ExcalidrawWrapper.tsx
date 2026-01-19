import React, { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI, ExcalidrawElement, AppState } from '@excalidraw/excalidraw/types';

// Export a mount function that uses the bundled React 18
// This avoids React version conflicts with the host
export function mount(
  container: HTMLElement,
  props?: ExcalidrawWrapperProps
): { unmount: () => void } {
  const root = createRoot(container);
  root.render(React.createElement(ExcalidrawWrapper, props));
  return {
    unmount: () => root.unmount()
  };
}

interface ExcalidrawWrapperProps {
  onSave?: (data: { elements: readonly ExcalidrawElement[]; appState: AppState }) => void;
  initialData?: { elements: readonly ExcalidrawElement[]; appState?: Partial<AppState> };
}

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ onSave, initialData }) => {
  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  // Handle theme detection
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  // Auto-save functionality
  const handleChange = (elements: readonly ExcalidrawElement[], appState: AppState) => {
    // Debounced save
    if (onSave) {
      onSave({ elements, appState });
    }
  };

  const handleExportImage = async () => {
    if (!excalidrawRef.current) return;

    const elements = excalidrawRef.current.getSceneElements();
    const appState = excalidrawRef.current.getAppState();

    try {
      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: darkMode,
        },
        files: excalidrawRef.current.getFiles(),
      });

      // Download the image
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'excalidraw-drawing.png';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export image:', error);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 12px',
        background: darkMode ? 'rgba(30, 41, 59, 0.9)' : '#f8fafc',
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
      }}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: darkMode ? 'rgba(99, 102, 241, 0.3)' : '#e0e7ff',
            color: darkMode ? '#c7d2fe' : '#4f46e5',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <button
          onClick={handleExportImage}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: darkMode ? 'rgba(34, 197, 94, 0.3)' : '#dcfce7',
            color: darkMode ? '#86efac' : '#16a34a',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          📷 Export PNG
        </button>
      </div>

      {/* Excalidraw Canvas */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Excalidraw
          ref={(api) => { excalidrawRef.current = api; }}
          initialData={initialData}
          onChange={handleChange}
          theme={darkMode ? 'dark' : 'light'}
          UIOptions={{
            canvasActions: {
              loadScene: true,
              saveToActiveFile: false,
              toggleTheme: false,
            },
          }}
        />
      </div>
    </div>
  );
};

export default ExcalidrawWrapper;
