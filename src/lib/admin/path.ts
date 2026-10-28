/** Dot paths into form state: `title.en`, `highlights.2.pt`, `links.live`. */
type Bag = Record<string, unknown> | unknown[];

const isBag = (value: unknown): value is Bag =>
  typeof value === 'object' && value !== null;

export function getIn(source: unknown, path: string): unknown {
  let current = source;
  for (const key of path.split('.')) {
    if (!isBag(current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Returns a copy with `value` at `path`; arrays and objects are created as needed. */
export function setIn<T>(source: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.');
  const key = head as string;
  const base: Bag = isBag(source)
    ? Array.isArray(source)
      ? [...source]
      : { ...source }
    : /^\d+$/.test(key)
      ? []
      : {};
  const child = (base as Record<string, unknown>)[key];
  (base as Record<string, unknown>)[key] =
    rest.length === 0
      ? value
      : setIn(
          isBag(child) ? child : /^\d+$/.test(rest[0] as string) ? [] : {},
          rest.join('.'),
          value,
        );
  return base as T;
}

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

export const removeItem = <T>(list: readonly T[], index: number): T[] =>
  list.filter((_, position) => position !== index);

/** DOM id for the control of a form path (error summary links point here). */
export const fieldId = (path: string) => `f-${path.replace(/\./g, '-')}`;
