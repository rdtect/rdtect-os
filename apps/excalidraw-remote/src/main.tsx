import React from 'react';
import { createRoot } from 'react-dom/client';
import ExcalidrawWrapper from './ExcalidrawWrapper';

// For standalone development testing
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ExcalidrawWrapper />
    </React.StrictMode>
  );
}
