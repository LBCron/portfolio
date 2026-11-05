'use client';

import { Component, type ReactNode } from 'react';

/**
 * A failed island (geoid, terminal) must not take down the page.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  public constructor(props: { children: ReactNode; fallback: ReactNode; onError?: () => void }) {
    super(props);
    this.state = { failed: false };
  }

  public static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  public override componentDidCatch(): void {
    this.props.onError?.();
  }

  public override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
