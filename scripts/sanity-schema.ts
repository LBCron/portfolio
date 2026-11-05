/**
 * Prints `sanity/schema.ts` as a schema declaration (one object literal per
 * type) for MCP-managed deployment.
 *
 * Bun run sanity:schema.
 */
import { schemaTypes } from '../sanity/schema';

const strip = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value, (_key, entry) => entry ?? undefined));

console.log(schemaTypes.map((type) => JSON.stringify(strip(type), null, 2)).join('\n\n'));
