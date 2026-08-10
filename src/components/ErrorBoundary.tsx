import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[Avenu crash]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: "2rem",
          margin: "2rem auto",
          maxWidth: "780px",
          background: "#052659",
          color: "#e7f1fb",
          fontFamily: "ui-monospace, Menlo, Consolas, monospace",
          fontSize: "0.9rem",
          border: "1px solid #C1E8FF",
          borderRadius: "12px",
          whiteSpace: "pre-wrap",
        }}>
          <h2 style={{ color: "#C1E8FF", fontFamily: "Sora, sans-serif", marginBottom: "1rem" }}>
            Avenu crashed — this error is being shown to help diagnose:
          </h2>
          <div style={{ marginBottom: "0.6rem" }}>
            <strong style={{ color: "#C1E8FF" }}>Error:</strong> {this.state.error.message}
          </div>
          <pre style={{ overflow: "auto" }}>{this.state.error.stack}</pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer", color: "#021024",
              background: "#C1E8FF", border: "none", borderRadius: "999px", fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
