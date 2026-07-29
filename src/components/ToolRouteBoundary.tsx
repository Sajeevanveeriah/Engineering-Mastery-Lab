import {
  Component,
  Suspense,
  type ComponentType,
  type ErrorInfo,
  type LazyExoticComponent
} from "react";
import { Link, useLocation } from "react-router";

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

interface BoundaryProps {
  component: LazyExoticComponent<ComponentType>;
  resetKey: string;
  toolName: string;
}

interface BoundaryState {
  attempt: number;
  failed: boolean;
  reloadRequired: boolean;
  resetKey: string;
}

function isChunkLoadFailure(error: Error): boolean {
  const detail = `${error.name} ${error.message}`.toLocaleLowerCase("en-AU");
  return [
    "chunkloaderror",
    "dynamically imported module",
    "importing a module script",
    "loading chunk",
    "module script failed",
    "module fetch"
  ].some((marker) => detail.includes(marker));
}

class ToolRouteErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = {
      attempt: 0,
      failed: false,
      reloadRequired: false,
      resetKey: props.resetKey
    };
  }

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return {
      failed: true,
      reloadRequired: isChunkLoadFailure(error)
    };
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState): BoundaryState | null {
    if (props.resetKey === state.resetKey) return null;
    return {
      attempt: state.attempt + 1,
      failed: false,
      reloadRequired: false,
      resetKey: props.resetKey
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isDevelopment) {
      console.error(`${this.props.toolName} route render failure`, error, info.componentStack);
    }
  }

  private retry = () => {
    if (this.state.reloadRequired) {
      window.location.reload();
      return;
    }
    this.setState((state) => ({
      attempt: state.attempt + 1,
      failed: false,
      reloadRequired: false
    }));
  };

  render() {
    if (!this.state.failed) {
      const LazyRoute = this.props.component;
      return (
        <Suspense
          fallback={(
            <div className="page route-loading" role="status">
              Loading {this.props.toolName}...
            </div>
          )}
        >
          <LazyRoute key={this.state.attempt} />
        </Suspense>
      );
    }

    return (
      <section className="page" aria-labelledby="tool-route-error-heading">
        <div className="card empty-state" role="alert">
          <p className="eyebrow">Local tool unavailable</p>
          <h1 id="tool-route-error-heading">{this.props.toolName} could not be opened</h1>
          <p className="muted">
            This tool stopped before it could display. Your locally stored progress was not deliberately changed.
            Retry the tool, or return to the analysis tools.
          </p>
          <div className="button-row button-row--centre">
            <button className="btn primary" type="button" onClick={this.retry}>
              Retry tool
            </button>
            <Link className="btn" to="/tools">Back to Analyse</Link>
          </div>
        </div>
      </section>
    );
  }
}

interface ToolRouteBoundaryProps {
  component: LazyExoticComponent<ComponentType>;
  toolName: string;
}

export function ToolRouteBoundary({ component, toolName }: ToolRouteBoundaryProps) {
  const location = useLocation();
  const resetKey = `${location.pathname}|${location.search}|${location.hash}`;

  return (
    <ToolRouteErrorBoundary component={component} resetKey={resetKey} toolName={toolName} />
  );
}
