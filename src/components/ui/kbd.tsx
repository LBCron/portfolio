import { type ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export function Kbd({ className, ...props }: ComponentProps<'kbd'>): React.JSX.Element {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-6 items-center justify-center rounded-[6px] border border-line-strong bg-surface-2 px-1.5 py-0.5',
        'font-mono text-[0.75rem] leading-none text-text-1 shadow-[inset_0_-1px_0_rgb(255_255_255/0.08)]',
        className,
      )}
      {...props}
    />
  );
}
