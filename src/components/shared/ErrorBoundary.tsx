import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
            <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6 border border-red-800">
              <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Something went wrong
            </h1>
            <p className="text-neutral-400 max-w-md mb-6">
              We encountered an unexpected error. Please refresh the page to try
              again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700"
            >
              <i className="fas fa-redo mr-2"></i>
              Reload Page
            </button>
            {this.state.error && (
              <details className="mt-6 text-left max-w-2xl">
                <summary className="text-neutral-500 text-sm cursor-pointer hover:text-neutral-400">
                  Technical Details
                </summary>
                <pre className="mt-3 p-4 bg-neutral-900 rounded text-xs text-red-400 overflow-auto border border-neutral-800">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}
