import { type ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export function Chip({ className, ...props }: ComponentProps<'span'>): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1',
        'font-mono text-[0.75rem] leading-none text-text-2',
        className,
      )}
      {...props}
    />
  );
}
