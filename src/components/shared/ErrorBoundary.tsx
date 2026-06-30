"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { ErrorState } from "@/components/shared/ErrorState";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      JSON.stringify({
        componentStack: errorInfo.componentStack,
        errorMessage: error.message,
        level: "error",
        message: "UI error boundary caught an error.",
        timestamp: new Date().toISOString()
      })
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorState
          action={
            <button
              className="rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-800 transition hover:bg-rose-100"
              onClick={this.handleRetry}
              type="button"
            >
              重试
            </button>
          }
          message="页面渲染时出现问题，请重试。"
          title="页面出错"
        />
      );
    }

    return this.props.children;
  }

  private readonly handleRetry = (): void => {
    this.setState({
      hasError: false
    });
  };
}
