'use client';

import { type ReactNode, useEffect } from 'react';

let hasNavigated = false;

/**
 * Cross-fades client-side route changes. The first page load is never faded, so
 * the LCP element paints immediately.
 */
export default function LocaleTemplate({ children }: { children: ReactNode }): React.JSX.Element {
  const animate = hasNavigated;

  useEffect(() => {
    hasNavigated = true;
  }, []);

  return <div className={animate ? 'route-fade' : undefined}>{children}</div>;
}
