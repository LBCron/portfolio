import { negotiateLocale } from './negotiate';

describe('negotiateLocale', () => {
  it('prefers a saved cookie over Accept-Language', () => {
    expect(negotiateLocale('pt', 'en-US,en;q=0.9')).toBe('pt');
  });

  it('ignores an invalid cookie', () => {
    expect(negotiateLocale('fr', 'pt-BR')).toBe('pt');
  });

  it('defaults to en without Accept-Language (crawlers)', () => {
    expect(negotiateLocale(undefined, null)).toBe('en');
    expect(negotiateLocale(undefined, '')).toBe('en');
  });

  it('matches regional tags to their language', () => {
    expect(negotiateLocale(undefined, 'pt-BR,pt;q=0.9,en;q=0.8')).toBe('pt');
    expect(negotiateLocale(undefined, 'en-GB')).toBe('en');
  });

  it('respects q-values regardless of order', () => {
    expect(negotiateLocale(undefined, 'en;q=0.5, pt;q=0.9')).toBe('pt');
  });

  it('skips unsupported languages and q=0', () => {
    expect(negotiateLocale(undefined, 'fr-FR, de;q=0.9, pt;q=0.1')).toBe('pt');
    expect(negotiateLocale(undefined, 'pt;q=0, en;q=0.2')).toBe('en');
    expect(negotiateLocale(undefined, 'fr, de')).toBe('en');
  });

  it('survives malformed headers', () => {
    expect(negotiateLocale(undefined, ';;,q=abc,,')).toBe('en');
  });
});
