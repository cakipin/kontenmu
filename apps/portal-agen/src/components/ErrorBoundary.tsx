import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[KontenMu] Error caught by boundary:",
      error,
      info.componentStack,
    );

    // Auto-reload on Vite dynamic import chunk errors (common after new deployments)
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed");

    if (isChunkError) {
      const reloadCount = parseInt(
        sessionStorage.getItem("vite-reload") || "0",
        10,
      );
      if (reloadCount < 2) {
        sessionStorage.setItem("vite-reload", (reloadCount + 1).toString());
        // Force cache bust on URL to ensure we get the fresh index.html
        const url = new URL(window.location.href);
        url.searchParams.set("t", Date.now().toString());
        window.location.href = url.toString();
      }
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              background: "var(--bg-secondary, #f8fafc)",
              border: "1px solid var(--border-subtle, #e2e8f0)",
              borderRadius: "16px",
              padding: "40px 32px",
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}
          >
            {/* Error icon */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                marginBottom: 24,
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text-primary, #1e293b)",
                marginBottom: 8,
              }}
            >
              Terjadi Kesalahan
            </h2>
            <p
              style={{
                color: "var(--text-secondary, #64748b)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              Halaman ini mengalami kesalahan yang tidak terduga. Coba muat
              ulang, atau kembali ke halaman sebelumnya.
            </p>

            {/* Error detail (collapsible) */}
            {this.state.error && (
              <details
                style={{
                  textAlign: "left",
                  background: "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginBottom: 24,
                  fontSize: "0.8rem",
                  color: "#ef4444",
                  cursor: "pointer",
                }}
              >
                <summary style={{ fontWeight: 600 }}>Detail error</summary>
                <pre
                  style={{
                    marginTop: 8,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    fontSize: "0.75rem",
                  }}
                >
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "var(--primary, #6366f1)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Coba Lagi
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "transparent",
                  color: "var(--text-secondary, #64748b)",
                  border: "1px solid var(--border-subtle, #e2e8f0)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
