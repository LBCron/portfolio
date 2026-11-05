type Details = Record<string, boolean | number | string | undefined>;

export interface ContentLogger {
  warn(event: string, details: Details): void;
}

/**
 * Content problems never break a page: they are logged and the offending
 * document or field is skipped. Details carry ids, paths and issue codes only,
 * never field values.
 */
export const contentLogger: ContentLogger = {
  warn(event, details) {
    console.warn(`[content] ${event}`, details);
  },
};
