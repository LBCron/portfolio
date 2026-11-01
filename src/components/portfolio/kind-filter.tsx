import { getTranslations } from 'next-intl/server';

import { RovingRadiogroup } from '@/components/ui/roving-radiogroup';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import type { ProjectKind } from '@/lib/content';
import { projectsLink } from '@/lib/projects';

interface KindFilterProps {
  kinds: readonly { kind: ProjectKind; count: number }[];
  active?: ProjectKind;
}

/** Crawlable single-select. Hidden by the caller when only one kind exists. */
export async function KindFilter({ kinds, active }: KindFilterProps) {
  const t = await getTranslations('projects');
  const options: { kind?: ProjectKind; label: string; count?: number }[] = [
    { label: t('all') },
    ...kinds.map((entry) => ({
      kind: entry.kind,
      label: t(`filters.${entry.kind}`),
      count: entry.count,
    })),
  ];

  return (
    <RovingRadiogroup
      aria-label={t('filterLabel')}
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const selected = option.kind === active;
        return (
          <Link
            key={option.kind ?? 'all'}
            href={projectsLink({ kind: option.kind, page: 1 })}
            role="radio"
            aria-checked={selected}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-small transition-colors',
              selected
                ? 'border-line-strong bg-surface-2 text-text-1'
                : 'border-line text-text-2 hover-fine:border-line-strong hover-fine:text-text-1',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span className="font-mono text-[0.75rem] text-text-3 tabular-nums">
                {option.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </RovingRadiogroup>
  );
}
