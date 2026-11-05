import { track as vaTrack } from '@vercel/analytics';

export type AnalyticsEvent =
  | 'email_click'
  | 'email_copy'
  | 'external_link'
  | 'language_switch'
  | 'resume_open'
  | 'terminal_open';

/**
 * Low-cardinality properties only: never put user input in here.
 */
export function track(event: AnalyticsEvent, properties?: Record<string, string>): void {
  try {
    vaTrack(event, properties);
  } catch {
    // Analytics must never break the page.
  }
}
