'use client';

import { CheckCircle2, CircleAlert, Info } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useToastStore } from '@/stores/toast-store';

const icons = { neutral: Info, success: CheckCircle2, error: CircleAlert };

/**
 * Polite live region for toasts. Always mounted so announcements fire.
 */
export function Toaster(): React.JSX.Element {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-(--z-toast) flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((item) => {
        const Glyph = icons[item.tone];

        return (
          <p
            key={item.id}
            className={cn(
              'flex animate-[toast-in_250ms_var(--ease-out-expo)] items-center gap-2 rounded-full border border-line-strong bg-surface-2 px-4 py-2',
              'text-small text-text-1 shadow-(--shadow-window)',
            )}
          >
            <Glyph
              aria-hidden="true"
              className={cn(
                'size-4',
                item.tone === 'success' && 'text-term-green',
                item.tone === 'error' && 'text-danger',
                item.tone === 'neutral' && 'text-accent-2',
              )}
            />
            {item.message}
          </p>
        );
      })}
    </div>
  );
}
