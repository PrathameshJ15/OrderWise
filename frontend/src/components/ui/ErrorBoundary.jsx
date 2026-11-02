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
        <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center p-6 font-sans">
          <div className="w-full max-w-xl bg-s border border-no/30 rounded-card p-8 shadow-none">
            <div className="flex items-center space-x-3 mb-3">
              <AlertTriangle className="text-no h-7 w-7" />
              <h1 className="text-[24px] font-bold tracking-tight text-white">
                Application Exception
              </h1>
            </div>
            <p className="text-[14px] text-t2 mb-4 leading-relaxed">
              An unexpected client runtime error occurred. Please review the details below or reload the session.
            </p>
            <div className="bg-s2 border border-bd rounded-card p-4 text-[12px] font-mono text-no overflow-x-auto mb-6">
              {this.state.error?.toString()}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={this.handleReload}
                className="btn-primary min-h-[44px] space-x-2 text-[14px]"
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
