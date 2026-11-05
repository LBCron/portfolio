'use client';

import { Pause } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/cn';
import { setMotionPaused, useMotionPaused } from '@/lib/motion-preference';

/**
 * "Pause animations" (WCAG 2.2.2). A toggle button with a stable label and
 * `aria-pressed`, persisted in localStorage.
 */
export function MotionToggle({ className }: { className?: string }): React.JSX.Element {
  const t = useTranslations('a11y');
  const paused = useMotionPaused();

  return (
    <button
      type="button"
      aria-pressed={paused}
      onClick={() => setMotionPaused(!paused)}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-small transition-colors duration-200',
        paused
          ? 'border-accent-2/50 bg-accent-2/10 text-text-1'
          : 'border-line text-text-2 hover-fine:border-line-strong hover-fine:text-text-1',
        className,
      )}
    >
      <Pause aria-hidden="true" className="size-4" />
      {t('pauseAnimations')}
    </button>
  );
}
