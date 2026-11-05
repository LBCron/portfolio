import { type Graph } from 'schema-dts';

import { serializeJsonLd } from '@/lib/seo/json-ld';

/**
 * The page's single structured-data block.
 */
export function JsonLd({ data }: { data: Graph }) {
  return (
    <script
      type="application/ld+json"
      // Escaped by serializeJsonLd; the only content-bearing exception to the
      // no-dangerouslySetInnerHTML rule (security rules, D21).
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
