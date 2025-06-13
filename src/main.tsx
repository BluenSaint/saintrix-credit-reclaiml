import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const root = document.getElementById('root');
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
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  root.innerHTML = `<div style="color: red; padding: 20px;">
    <h1>Failed to load application</h1>
    <pre>${errorMessage}</pre>
  </div>`;
}
