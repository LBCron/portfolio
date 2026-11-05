'use client';

import { type ReactNode, type ToggleEvent, useState } from 'react';

/**
 * Uncontrolled-feeling `<details>` that can start open (D46).
 */
export function JobDetails({
  openByDefault,
  className,
  children,
}: {
  children: ReactNode;
  className?: string;
  openByDefault: boolean;
}): React.JSX.Element {
  const [open, setOpen] = useState(openByDefault);

  function onToggle(event: ToggleEvent<HTMLDetailsElement>): void {
    setOpen(event.currentTarget.open);
  }

  return (
    <details className={className} open={open} onToggle={onToggle}>
      {children}
    </details>
  );
}
