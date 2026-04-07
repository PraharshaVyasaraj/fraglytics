import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 m-4 bg-tactical-dark border border-red-500/30 rounded-lg text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Data Render Error</h2>
          <p className="text-tactical-gray mb-4 max-w-md">
            {this.props.fallbackMessage || "We encountered an issue displaying this component. The data might be corrupted or missing required fields."}
          </p>
          <div className="bg-black/50 p-4 rounded-md text-left w-full overflow-auto max-h-40">
            <code className="text-red-400 text-xs font-mono">
              {this.state.error?.message || "Unknown error"}
            </code>
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-sm transition-colors text-sm font-bold uppercase tracking-wider"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
