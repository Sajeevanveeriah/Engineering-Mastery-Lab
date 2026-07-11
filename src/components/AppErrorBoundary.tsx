import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Engineering Workbench render failure", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="fatal-error" id="main-content">
        <div className="card fatal-error__card" role="alert">
          <p className="eyebrow">Application error</p>
          <h1>This screen could not be rendered</h1>
          <p className="muted">
            Your locally stored progress has not been deliberately changed. Reload the app first; if the problem
            persists, export the browser console error with the route you opened.
          </p>
          <details>
            <summary>Technical detail</summary>
            <pre>{this.state.error.message}</pre>
          </details>
          <button className="primary" type="button" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </div>
      </main>
    );
  }
}
