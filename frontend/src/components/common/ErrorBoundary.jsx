import React, { Component } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Button from "../ui/Button";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F3] rounded-2xl border border-[#D8C6A5]/50 m-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#272A1F]">Something went wrong</h2>
          <p className="text-sm text-[#5E5947] max-w-md mt-2 mb-6">
            An unexpected error occurred. You can reload the page or return home.
          </p>
          <Button
            variant="primary"
            icon={RotateCcw}
            onClick={this.handleReset}
          >
            Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

