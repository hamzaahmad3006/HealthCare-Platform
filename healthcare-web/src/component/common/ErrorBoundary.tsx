import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '../../constant/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // Surface to the browser console so it shows up in dev tools / error
    // tracking integrations. We don't have a real tracker wired up yet.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.assign('/');
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl ring-1 ring-ink-100 shadow-card p-8 text-center animate-fade-in">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-danger-50 text-danger-700 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-ink-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-600 leading-relaxed">
            The page hit an unexpected error. We&apos;ve logged it. Try reloading — if the problem
            persists, head back to the home page.
          </p>
          {this.state.error.message ? (
            <p className="mt-4 text-xs font-mono text-ink-500 bg-ink-50 rounded-lg px-3 py-2 text-left break-words">
              {this.state.error.message}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => window.location.reload()} leftIcon={<RefreshCcw className="h-4 w-4" />}>
              Reload page
            </Button>
            <Button variant="outline" onClick={this.handleReload}>
              Back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
