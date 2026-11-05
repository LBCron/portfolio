import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { type Crumb } from '@/lib/seo/json-ld';

export async function Breadcrumb({
  crumbs,
}: {
  crumbs: readonly Crumb[];
}): Promise<React.JSX.Element> {
  const t = await getTranslations('a11y');
  const last = crumbs.length - 1;

  return (
    <nav aria-label={t('breadcrumb')}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-text-3">
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.path}:${crumb.name}`} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-text-3">
                /
              </span>
            ) : null}
            {index < last ? (
              <Link
                href={crumb.path || '/'}
                className="text-text-2 underline-offset-4 hover-fine:text-text-1 hover-fine:underline"
              >
                {crumb.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-text-1">
                {crumb.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
