import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { cn } from '@/lib/cn';

const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-label', {
  variants: {
    tone: {
      neutral: 'bg-bg-0/80 text-text-1 ring-1 ring-line-strong',
      accent: 'bg-accent-1/15 text-text-1 ring-1 ring-accent-1/40',
      success: 'bg-term-green/10 text-term-green ring-1 ring-term-green/30',
      warn: 'bg-warn/10 text-warn ring-1 ring-warn/30',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>): React.JSX.Element {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
