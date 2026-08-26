import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Telemetry } from "@/lib/telemetry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches unhandled JS errors
 * and displays a recovery UI instead of crashing the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Record to telemetry with error details and stack
    Telemetry.recordError(error, { componentStack: errorInfo.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#101416",
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <Text
            style={{
              color: "#e0e3e6",
              fontSize: 22,
              fontWeight: "bold",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              color: "#908f9d",
              fontSize: 15,
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 22,
              maxWidth: 300,
            }}
          >
            EduCard encountered an unexpected error. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text
              style={{
                color: "#ffb4ab",
                fontSize: 12,
                textAlign: "center",
                marginBottom: 24,
                maxWidth: 300,
                fontFamily: "monospace",
              }}
            >
              {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              backgroundColor: "#bdc2ff",
              paddingHorizontal: 28,
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: "#101416",
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
