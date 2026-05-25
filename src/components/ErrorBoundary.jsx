/**
 * ErrorBoundary.jsx — vangt JS-crashes per route op.
 *
 * Zonder boundary geeft React een white screen bij elke uncaught error
 * in render/lifecycle. Met boundary tonen we een vriendelijke fallback
 * met retry-knop + naar-home-knop, en loggen we de error (in dev
 * naar console, in prod naar /errors endpoint als beschikbaar).
 *
 * Gebruik:
 *   <ErrorBoundary fallback={Component}>
 *     <Route content />
 *   </ErrorBoundary>
 *
 * Of via withErrorBoundary HOC voor per-route wrapping.
 */
import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error) {
    // Genereer korte error-id voor support-correlatie
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error, errorInfo) {
    // Log in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Uncaught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
    // Stuur naar backend in productie — silent fail als endpoint niet bestaat
    if (import.meta.env.PROD) {
      try {
        const payload = {
          errorId: this.state.errorId,
          message: error?.message || String(error),
          stack: (error?.stack || '').slice(0, 2000),
          componentStack: (errorInfo?.componentStack || '').slice(0, 2000),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date().toISOString(),
        };
        const apiUrl = import.meta.env.VITE_API_URL || '';
        // Gebruik fetch met no-cors fallback — endpoint mag ontbreken
        fetch(`${apiUrl}/errors/frontend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true, // overleeft navigatie
        }).catch(() => {
          // Silent fail — endpoint optioneel
        });
      } catch {
        // Crash binnen catch — give up
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Custom fallback via prop
    if (this.props.fallback) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} errorId={this.state.errorId} onRetry={this.handleRetry} />;
    }

    // Default fallback — vriendelijk, twee-talig fallback
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">
            Er ging iets mis
          </h1>
          <p className="text-gray-600 mb-2">
            We konden deze pagina niet correct laden. Probeer het opnieuw of ga terug naar de
            startpagina.
          </p>
          <p className="text-xs text-gray-400 mb-6 font-mono">
            {this.state.errorId}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.handleRetry}
              className="btn-primary text-sm"
            >
              Opnieuw proberen
            </button>
            <Link
              to="/"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-2.5 transition inline-flex items-center justify-center"
            >
              Naar startpagina
            </Link>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-8 text-left bg-gray-50 rounded-lg p-4 text-xs font-mono text-gray-700">
              <summary className="cursor-pointer font-bold mb-2">Stack trace (dev only)</summary>
              <pre className="overflow-auto whitespace-pre-wrap break-words">
                {this.state.error?.stack || String(this.state.error)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

/**
 * HOC voor inline route-wrapping.
 *   <Route element={withErrorBoundary(<MyPage />)} />
 */
export function withErrorBoundary(element, fallback) {
  return <ErrorBoundary fallback={fallback}>{element}</ErrorBoundary>;
}
