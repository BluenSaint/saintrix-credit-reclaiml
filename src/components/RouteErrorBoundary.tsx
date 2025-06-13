import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class RouteErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log error to your error tracking service here
    console.error('Route ErrorBoundary caught an error:', error, info);

    // Show error toast
    toast.error('An error occurred while loading this page. Please try again.');
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Page Error</h2>
                <p className="text-sm text-gray-600 mb-4">
                  {this.state.error?.message || 'An error occurred while loading this page'}
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Refresh Page
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
