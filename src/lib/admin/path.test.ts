import { describe, expect, it } from 'vitest';

import { fieldId, getIn, moveItem, removeItem, setIn } from './path';

describe('paths', () => {
  const doc = { title: { en: 'a', pt: 'b' }, list: [{ x: 1 }, { x: 2 }] };

  it('reads nested values and misses safely', () => {
    expect(getIn(doc, 'title.pt')).toBe('b');
    expect(getIn(doc, 'list.1.x')).toBe(2);
    expect(getIn(doc, 'nope.deep')).toBeUndefined();
    expect(getIn(null, 'a')).toBeUndefined();
  });

  it('writes immutably and creates missing containers', () => {
    const next = setIn(doc, 'title.en', 'z');

    expect(next).not.toBe(doc);
    expect(doc.title.en).toBe('a');
    expect(next.title.en).toBe('z');
    expect(next.list).toBe(doc.list);
    expect(setIn({}, 'links.live', 'u')).toEqual({ links: { live: 'u' } });
    expect(setIn({}, 'items.1.en', 'x')).toEqual({
      items: [undefined, { en: 'x' }],
    });
    expect(setIn(doc, 'list.0.x', 9).list).toEqual([{ x: 9 }, { x: 2 }]);
  });

  it('moves and removes list items', () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 1, 5)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 2, -1)).toEqual([1, 2, 3]);
    expect(removeItem([1, 2, 3], 1)).toEqual([1, 3]);
  });

  it('builds element ids from paths', () => {
    expect(fieldId('highlights.0.en')).toBe('f-highlights-0-en');
  });
});
