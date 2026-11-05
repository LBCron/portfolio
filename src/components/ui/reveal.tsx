'use client';

import { type ComponentProps, type CSSProperties, useLayoutEffect, useRef } from 'react';

import { cn } from '@/lib/cn';

interface RevealProps extends ComponentProps<'div'> {
  /**
   * Position inside a group; each step adds a 60ms delay.
   */
  index?: number;
}

/**
 * Fade + 16px rise the first time 20% of the element is visible. The server
 * renders content fully visible; only elements that start below the fold are
 * hidden after hydration, so nothing flashes and no-JS visitors see it all.
 */
export function Reveal({ index = 0, className, style, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;

    const root = document.documentElement;
    const reduced =
      root.dataset.motion === 'reduced'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || element.getBoundingClientRect().top < window.innerHeight) {
      return;
    }

    element.dataset.reveal = 'pending';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        element.dataset.reveal = 'shown';
        observer.disconnect();
      },
      { threshold: 0.2 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'data-[reveal=pending]:translate-y-4 data-[reveal=pending]:opacity-0',
        'transition-[opacity,translate] duration-[600ms] ease-out-expo',
        className,
      )}
      style={{ transitionDelay: `${index * 60}ms`, ...style } as CSSProperties}
      {...props}
    />
  );
}
