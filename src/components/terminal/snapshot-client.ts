import { type AppLocale } from '@/i18n/routing';
import { type ContentSnapshot } from '@/lib/terminal/snapshot';

const cache = new Map<AppLocale, Promise<ContentSnapshot>>();
const loaded = new Map<AppLocale, ContentSnapshot>();

/**
 * First-party fetch of the public snapshot; one request per locale per tab.
 */
export function loadSnapshot(locale: AppLocale): Promise<ContentSnapshot> {
  let pending = cache.get(locale);

  if (!pending) {
    pending = fetch(`/api/terminal-content?locale=${locale}`)
      .then((response) => {
        if (!response.ok) throw new Error(`snapshot ${response.status}`);

        return response.json() as Promise<ContentSnapshot>;
      })
      .then((snapshot) => {
        loaded.set(locale, snapshot);

        return snapshot;
      })
      .catch((error: unknown) => {
        cache.delete(locale);
        throw error;
      });
    cache.set(locale, pending);
  }

  return pending;
}

/**
 * The snapshot if it already arrived (used by synchronous completion).
 */
export function peekSnapshot(locale: AppLocale): ContentSnapshot | null {
  return loaded.get(locale) ?? null;
}
