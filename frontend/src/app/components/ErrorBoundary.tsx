import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

// Catches render-time crashes so users see a message instead of a blank
// white page, and logs full details to the console for debugging. Append
// ?debug=1 to the URL to also show the error/component stack on-screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Uncaught render error:", error, info.componentStack);
    this.setState({ componentStack: info.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;

    const showDetails = new URLSearchParams(window.location.search).has("debug");

    return (
      <div style={{ padding: "48px 24px", maxWidth: 640, margin: "0 auto", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong.</h1>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
          Please refresh the page. If this keeps happening, contact support.
        </p>
        {showDetails && (
          <pre style={{
            fontSize: 11, whiteSpace: "pre-wrap", background: "#f5f5f5",
            padding: 12, border: "1px solid #ddd", color: "#b91c1c",
          }}>
            {this.state.error.message}
            {"\n"}
            {this.state.componentStack}
          </pre>
        )}
      </div>
    );
  }
}
