import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-destructive/40 bg-card/60 p-8 clip-edges text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold uppercase tracking-widest mb-2">
            System Fault
          </h1>
          <p className="font-mono text-sm text-muted-foreground mb-6 break-all">
            {this.state.error.message}
          </p>
          <Button onClick={this.reset} className="font-mono">
            <RotateCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }
}
