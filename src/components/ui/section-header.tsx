import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface SectionHeaderProps {
  className?: string;
  eyebrow: string;
  id: string;
  index: number;
  lead?: ReactNode;
  title: ReactNode;
}

/**
 * Mono eyebrow with number ("01 — About"), h2 and optional lead.
 */
export function SectionHeader({
  id,
  index,
  eyebrow,
  title,
  lead,
  className,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <header className={cn('mb-12 max-w-3xl md:mb-16', className)}>
      <p className="mb-4 flex items-center gap-3 font-label text-text-3">
        <span className="text-gradient">{String(index).padStart(2, '0')}</span>
        <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
        <span>{eyebrow}</span>
      </p>
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      {lead ? <p className="mt-5 measure text-text-2">{lead}</p> : null}
    </header>
  );
}
