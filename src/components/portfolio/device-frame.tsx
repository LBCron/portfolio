import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { type ProjectKind } from '@/lib/content';

const DOTS = ['bg-danger/80', 'bg-warn/80', 'bg-term-green/80'] as const;

/**
 * Decorative browser / device chrome around a cover. Hidden from AT.
 */
export function DeviceFrame({ kind, children }: { children: ReactNode; kind: ProjectKind }) {
  const phone = kind === 'mobile';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden border border-line-strong bg-surface-2 shadow-(--shadow-window)',
        phone ? 'mx-auto max-w-sm rounded-[2rem] p-3' : 'rounded-xl',
      )}
    >
      {phone ? (
        <div className="mb-2 flex justify-center">
          <span className="h-1.5 w-16 rounded-full bg-line-strong" />
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          {DOTS.map((color) => (
            <span key={color} className={cn('size-2.5 rounded-full', color)} />
          ))}
          <span className="ml-3 h-5 flex-1 rounded-full bg-bg-0/60" />
        </div>
      )}
      <div className={cn('relative aspect-[16/10] overflow-hidden', phone && 'rounded-[1.25rem]')}>
        {children}
      </div>
    </div>
  );
}
