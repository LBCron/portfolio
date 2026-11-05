import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { type ProjectKind } from '@/lib/content';
import { projectsLink } from '@/lib/projects';

interface PaginationProps {
  kind?: ProjectKind;
  page: number;
  totalPages: number;
}

export async function Pagination({
  page,
  totalPages,
  kind,
}: PaginationProps): Promise<null | React.JSX.Element> {
  if (totalPages <= 1) return null;

  const t = await getTranslations('projects');
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label={t('pagination')} className="mt-14 flex justify-center">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link href={projectsLink({ kind, page: page - 1 })} className={pageLink()}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('previousPage')}
            </Link>
          ) : (
            <span className={pageLink(true)}>{t('previousPage')}</span>
          )}
        </li>
        {pages.map((number) => (
          <li key={number}>
            <Link
              href={projectsLink({ kind, page: number })}
              aria-label={t('pageLabel', { page: number })}
              aria-current={number === page ? 'page' : undefined}
              className={cn(
                'inline-flex size-11 items-center justify-center rounded-full border text-small tabular-nums',
                number === page
                  ? 'border-line-strong bg-surface-2 text-text-1'
                  : 'border-line text-text-2 hover-fine:border-line-strong hover-fine:text-text-1',
              )}
            >
              {number}
            </Link>
          </li>
        ))}
        <li>
          {page < totalPages ? (
            <Link href={projectsLink({ kind, page: page + 1 })} className={pageLink()}>
              {t('nextPage')}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <span className={pageLink(true)}>{t('nextPage')}</span>
          )}
        </li>
      </ul>
    </nav>
  );
}

function pageLink(disabled = false): string {
  return cn(
    'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-small',
    disabled ? 'text-text-3' : 'text-text-2 hover-fine:text-text-1',
  );
}
