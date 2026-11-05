'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { LANGUAGE_SWITCH_KEY } from './switch-locale';

/**
 * After a language switch: restores the approximate scroll position and
 * politely announces the new language (in that language).
 */
export function LanguageAnnouncer(): React.JSX.Element {
  const t = useTranslations('a11y');
  const locale = useLocale();
  const [message, setMessage] = useState('');

  useEffect(() => {
    let raw: null | string = null;

    try {
      raw = sessionStorage.getItem(LANGUAGE_SWITCH_KEY);
      sessionStorage.removeItem(LANGUAGE_SWITCH_KEY);
    } catch {
      return;
    }

    if (!raw) return;

    const { ratio, hash } = JSON.parse(raw) as { hash: string; ratio: number };

    requestAnimationFrame(() => {
      const target = hash ? document.getElementById(hash.slice(1)) : null;

      if (target && ratio === 0) {
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
      } else {
        const max = document.documentElement.scrollHeight - window.innerHeight;

        window.scrollTo({ top: ratio * max, behavior: 'instant' });
      }

      setMessage(t('languageChanged'));
    });

    const timer = window.setTimeout(() => setMessage(''), 4000);

    return (): void => window.clearTimeout(timer);
  }, [locale, t]);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}
