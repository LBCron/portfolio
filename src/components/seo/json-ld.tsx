import { type Graph } from 'schema-dts';

import { serializeJsonLd } from '@/lib/seo/json-ld';

/**
 * The page's single structured-data block.
 */
export function JsonLd({ data }: { data: Graph }): React.JSX.Element {
  return (
    <script
      type="application/ld+json"
      // Escaped by serializeJsonLd; the only content-bearing exception to the
      // no-dangerouslySetInnerHTML rule (security rules, D21).
      // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- escaped by serializeJsonLd
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
