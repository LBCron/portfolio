import { getTranslations } from 'next-intl/server';

export async function SkipLink() {
  const t = await getTranslations('a11y');

  return (
    <a
      href="#main"
      className="fixed top-3 left-3 z-(--z-toast) -translate-y-24 rounded-full bg-text-1 px-5 py-3 text-small font-medium text-bg-0 transition-transform duration-200 focus-visible:translate-y-0"
    >
      {t('skipToContent')}
    </a>
  );
}
