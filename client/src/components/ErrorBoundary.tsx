import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging but don't expose to user
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Prevent browser from accessing undefined objects that could cause autoCorrectionCache errors
    if (error.message?.includes('autoCorrectionCache') || 
        error.message?.includes('Cannot read properties of undefined')) {
      // Clear any problematic state and reset
      this.setState({ hasError: false });
      return;
    }
  }

  render() {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }

    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-md">
          <div className="text-center">
            <h3 className="font-medium">Something went wrong</h3>
            <p className="text-sm opacity-75">Please refresh the page to continue</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;