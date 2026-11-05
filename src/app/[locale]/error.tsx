'use client';

import { RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function LocaleError({
  retry,
}: {
  error: { digest?: string } & Error;
  retry: () => void;
}) {
  const t = useTranslations('errors');
  const locale = useLocale();

  return (
    <section className="container-page flex min-h-[70dvh] flex-col justify-center py-32">
      <p className="mb-6 font-mono text-small text-danger">
        visitor@julio-muller:~$ <span aria-hidden="true">✗</span> exit 1
      </p>
      <h1 className="text-h2">{t('errorTitle')}</h1>
      <p className="mt-4 measure text-text-2">{t('errorText')}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-text-1 px-6 text-small font-medium text-bg-0"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          {t('tryAgain')}
        </button>
        <a
          href={`/${locale}`}
          className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-6 text-small text-text-1"
        >
          {t('backHome')}
        </a>
      </div>
    </section>
  );
}
