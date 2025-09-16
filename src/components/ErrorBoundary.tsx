"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Filter out CancelledError from React Query
    if (error?.name === "CancelledError" || error?.message?.includes("CancelledError")) {
      console.debug("Suppressed CancelledError from React Query");
      return { hasError: false };
    }
    
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log the error to console but don't show to user if it's a CancelledError
    if (error?.name === "CancelledError" || error?.message?.includes("CancelledError")) {
      console.debug("CancelledError caught in ErrorBoundary:", error);
      return;
    }
    
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  componentDidMount() {
    // Add a global handler for unhandled promise rejections
    if (typeof window !== "undefined") {
      // Use capture phase (third parameter true) to catch errors earlier
      window.addEventListener("unhandledrejection", this.handleUnhandledRejection, true);
      window.addEventListener("error", this.handleGlobalError, true);
      
      // Also override console.error to catch CancelledError
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const firstArg = args[0];
        if (
          firstArg?.name === "CancelledError" ||
          firstArg?.message?.includes("CancelledError") ||
          (typeof firstArg === "string" && firstArg.includes("CancelledError"))
        ) {
          console.debug("Suppressed CancelledError from console.error:", ...args);
          return;
        }
        originalConsoleError.apply(console, args);
      };
      
      // Also patch Promise.reject to catch CancelledErrors at the source
      const originalReject = Promise.reject;
      Promise.reject = function(reason) {
        if (
          reason?.name === "CancelledError" ||
          reason?.message?.includes("CancelledError")
        ) {
          console.debug("Suppressed CancelledError at Promise.reject:", reason);
          // Return a resolved promise instead of rejecting
          return Promise.resolve();
        }
        return originalReject.call(Promise, reason);
      };
    }
  }

  componentWillUnmount() {
    if (typeof window !== "undefined") {
      window.removeEventListener("unhandledrejection", this.handleUnhandledRejection, true);
      window.removeEventListener("error", this.handleGlobalError, true);
    }
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Check if it's a CancelledError and suppress it
    if (
      event.reason?.name === "CancelledError" ||
      event.reason?.message?.includes("CancelledError") ||
      event.reason?.constructor?.name === "CancelledError" ||
      event.reason?.toString?.()?.includes("CancelledError")
    ) {
      event.preventDefault(); // Prevent the error from being shown
      event.stopPropagation?.(); // Stop propagation if available
      console.debug("Suppressed unhandled CancelledError:", event.reason);
      return false; // Explicitly return false to stop propagation
    }
  };

  handleGlobalError = (event: ErrorEvent) => {
    // Check if it's a CancelledError and suppress it
    if (
      event.error?.name === "CancelledError" ||
      event.message?.includes("CancelledError") ||
      event.error?.toString?.()?.includes("CancelledError")
    ) {
      event.preventDefault(); // Prevent the error from being shown
      event.stopPropagation?.(); // Stop propagation if available
      console.debug("Suppressed global CancelledError:", event.error);
      return false; // Explicitly return false to stop propagation
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <h2 className="text-2xl font-semibold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}