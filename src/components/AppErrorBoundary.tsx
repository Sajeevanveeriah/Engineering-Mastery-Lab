import { Component, type ErrorInfo, type ReactNode } from "react";

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(_error: Error): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isDevelopment) {
      console.error("Engineering Mastery Lab render failure", error, info.componentStack);
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="fatal-error" id="main-content">
        <div className="card fatal-error__card" role="alert">
          <p className="eyebrow">Application error</p>
          <h1>This screen could not be rendered</h1>
          <p className="muted">
            Your locally stored progress has not been deliberately changed. Reload the application to recover this
            screen. Technical details are recorded only in the development console.
          </p>
          <button className="btn primary" type="button" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </div>
      </main>
    );
  }
}
