'use client';

import { type CSSProperties, useEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import { fitFontSize } from '@/lib/fit-text';

/**
 * The hero H1: one line that never wraps or clips. CSS (`title-fit`) gives a
 * first-paint estimate from the character count; this measures the real text,
 * also after fonts load, and sets `--fit` on the element (no React state).
 */
export function FitTitle({
  id,
  className,
  fontFamily,
  children,
}: {
  children: string;
  className?: string;
  fontFamily?: string | undefined;
  id?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;

    if (!el || !parent) return;

    const fit = () => {
      el.style.removeProperty('--fit');

      const style = getComputedStyle(el);
      const max = parseFloat(style.getPropertyValue('--title-max'));
      const size = fitFontSize({
        available: el.clientWidth,
        contentWidth: el.scrollWidth,
        fontSize: parseFloat(style.fontSize),
        max: max > 0 ? max : parseFloat(style.fontSize),
      });

      el.style.setProperty('--fit', `${size}px`);
    };

    fit();

    const observer = new ResizeObserver(fit);

    observer.observe(parent);
    document.fonts.ready.then(fit);

    return () => observer.disconnect();
  }, [children]);

  return (
    <h1
      ref={ref}
      id={id}
      style={{ '--chars': children.length, fontFamily } as CSSProperties}
      className={cn('title-fit', className)}
    >
      {children}
    </h1>
  );
}
