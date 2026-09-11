'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ForecastErrorBoundaryProps {
  fallbackMessage: string
  children: ReactNode
}

interface ForecastErrorBoundaryState {
  hasError: boolean
}

/**
 * Section-level error boundary for forecast components.
 * When a child throws during rendering, displays a styled fallback message
 * instead of crashing the entire page.
 */
export class ForecastErrorBoundary extends Component<
  ForecastErrorBoundaryProps,
  ForecastErrorBoundaryState
> {
  constructor(props: ForecastErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ForecastErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[ForecastErrorBoundary] ${this.props.fallbackMessage}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
          {this.props.fallbackMessage}
        </div>
      )
    }

    return this.props.children
  }
}
