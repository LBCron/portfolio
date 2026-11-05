import { type AppLocale, isAppLocale, routing } from './routing';

interface WeightedTag {
  index: number;
  q: number;
  tag: string;
}

function parseAcceptLanguage(header: string): WeightedTag[] {
  return header
    .split(',')
    .map((part, index) => {
      const [rawTag = '', ...params] = part.trim().split(';');
      const qParam = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;

      return {
        tag: rawTag.trim().toLowerCase(),
        q: Number.isFinite(q) ? q : 0,
        index,
      };
    })
    .filter(({ tag, q }) => tag.length > 0 && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
}

/**
 * Saved preference → Accept-Language → default. Requests without either
 * (crawlers) get the default locale.
 */
export function negotiateLocale(
  cookieValue: string | undefined,
  acceptLanguage: null | string,
): AppLocale {
  if (isAppLocale(cookieValue)) return cookieValue;

  if (!acceptLanguage) return routing.defaultLocale;

  for (const { tag } of parseAcceptLanguage(acceptLanguage)) {
    const primary = tag.split('-')[0];

    if (isAppLocale(primary)) return primary;
  }

  return routing.defaultLocale;
}
