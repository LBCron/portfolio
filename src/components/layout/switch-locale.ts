import type { AppLocale } from '@/i18n/routing';
import { saveLocalePreference } from '@/i18n/locale-cookie';
import type { useRouter } from '@/i18n/navigation';

export const LANGUAGE_SWITCH_KEY = 'jm.language-switch';

/**
 * Switches the site language the way the header switcher does: saves the
 * choice, keeps query, hash and approximate scroll position.
 */
export function switchLocale(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  target: AppLocale,
) {
  saveLocalePreference(target);
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  try {
    sessionStorage.setItem(
      LANGUAGE_SWITCH_KEY,
      JSON.stringify({
        ratio: maxScroll > 0 ? window.scrollY / maxScroll : 0,
        hash: window.location.hash,
      }),
    );
  } catch {
    // Without storage the switch still works; scroll is simply not kept.
  }
  router.replace(
    `${pathname}${window.location.search}${window.location.hash}`,
    { locale: target, scroll: false },
  );
}
