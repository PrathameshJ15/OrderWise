import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('OrderWise ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-arcade-surface text-arcade-primary flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-xl bg-arcade-neutral border border-arcade-danger p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="text-arcade-danger h-8 w-8" />
              <h1 className="font-display uppercase text-2xl tracking-wider text-arcade-primary font-bold">
                Application Exception
              </h1>
            </div>
            <p className="text-sm text-arcade-secondary mb-4 leading-relaxed">
              An unexpected client runtime error occurred. Please review the details below or reload the session.
            </p>
            <div className="bg-arcade-surface border border-arcade-border p-4 text-xs font-mono text-arcade-danger overflow-x-auto mb-6">
              {this.state.error?.toString()}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={this.handleReload}
                className="flex items-center space-x-2 bg-arcade-accent text-arcade-surface px-5 py-2.5 font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
