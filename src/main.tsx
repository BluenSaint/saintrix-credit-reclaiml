import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log('App initializing...');

const root = document.getElementById("root");
if (!root) {
  throw new Error('Root element not found');
}

try {
  const reactRoot = createRoot(root);
  reactRoot.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
  root.innerHTML = `<div style="color: red; padding: 20px;">
    <h1>Failed to load application</h1>
    <pre>${error.toString()}</pre>
  </div>`;
}
