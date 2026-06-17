/**
 * ErrorBoundary.js
 *
 * Catches JavaScript errors in its child component tree and renders a
 * user-friendly fallback instead of a white screen.
 *
 * Covers two categories of failure:
 *   1. Chunk load failures — when a lazy-loaded route chunk fails to download
 *      (network offline, new deploy flushed old chunks, etc.).
 *   2. Runtime render errors — any uncaught exception during React rendering.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Suspense fallback={<PageLoader />}>
 *       <Routes>...</Routes>
 *     </Suspense>
 *   </ErrorBoundary>
 *
 * You can also use the route-scoped version for per-section recovery:
 *   <ErrorBoundary fallbackMessage="This section failed to load.">
 *     <SomeLazyComponent />
 *   </ErrorBoundary>
 */

import { Component } from "react";

// ── Fallback UI ────────────────────────────────────────────────────────────────
function DefaultFallback({ error, onRetry, fallbackMessage }) {
  const isChunkError =
    error &&
    (error.name === "ChunkLoadError" ||
      (error.message && error.message.includes("Loading chunk")));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#f3e8ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
          fontSize: "2rem",
        }}
      >
        {isChunkError ? "📡" : "⚠️"}
      </div>

      {/* Heading */}
      <h2 style={{ color: "#4c1d95", fontSize: "1.5rem", marginBottom: "0.75rem" }}>
        {isChunkError ? "Update Available" : "Something went wrong"}
      </h2>

      {/* Message */}
      <p style={{ color: "#6b7280", maxWidth: 400, marginBottom: "1.5rem", lineHeight: 1.6 }}>
        {fallbackMessage ||
          (isChunkError
            ? "The app has been updated. Please refresh to load the latest version."
            : "This page encountered an unexpected error. Try refreshing or going back.")}
      </p>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onRetry}
          style={{
            background: "#7c3aed",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.6rem 1.4rem",
            fontSize: "0.9rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {isChunkError ? "Refresh Page" : "Try Again"}
        </button>
        <button
          onClick={() => window.history.back()}
          style={{
            background: "#f3e8ff",
            color: "#7c3aed",
            border: "1px solid #c4b5fd",
            borderRadius: 8,
            padding: "0.6rem 1.4rem",
            fontSize: "0.9rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

// ── Error Boundary class component ────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this._handleRetry = this._handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev; wire to Sentry / error tracker in production.
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary] Caught error:", error, info);
    } else {
      // TODO: Replace with your error tracking service
      // Sentry.captureException(error, { extra: info });
      console.error("[ErrorBoundary] Error caught — check your error tracker.");
    }
  }

  _handleRetry() {
    const { error } = this.state;
    // For chunk errors, a full reload is the correct fix (fetches updated chunk manifest)
    const isChunkError =
      error &&
      (error.name === "ChunkLoadError" ||
        (error.message && error.message.includes("Loading chunk")));

    if (isChunkError) {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallbackMessage, FallbackComponent } = this.props;

    if (!hasError) return children;

    if (FallbackComponent) {
      return <FallbackComponent error={error} onRetry={this._handleRetry} />;
    }

    return (
      <DefaultFallback
        error={error}
        onRetry={this._handleRetry}
        fallbackMessage={fallbackMessage}
      />
    );
  }
}

export default ErrorBoundary;
