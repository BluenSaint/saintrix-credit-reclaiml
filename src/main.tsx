import React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Debug logging
console.log('Environment:', import.meta.env.MODE);
console.log('App initializing...');

const root = document.getElementById("root");
if (!root) {
  throw new Error('Root element not found');
}

try {
  const reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  root.innerHTML = `<div style="color: red; padding: 20px;">
    <h1>Failed to load application</h1>
    <pre>${error instanceof Error ? error.toString() : 'Unknown error'}</pre>
  </div>`;
}
