'use client';

import { useLayoutEffect, useRef } from 'react';

const DURATION_MS = 1400;

interface CountUpProps {
  /**
   * BCP-47 tag for `Intl.NumberFormat`.
   */
  localeTag: string;
  prefix?: string;
  suffix?: string;
  to: number;
}

/**
 * Renders the final value on the server (no-JS and crawlers see it). After
 * hydration, a value still below the fold restarts at zero and counts up once
 * in view, writing text through the ref.
 */
export function CountUp({ to, prefix = '', suffix = '', localeTag }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;

    const reduced =
      document.documentElement.dataset.motion === 'reduced'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || element.getBoundingClientRect().top < window.innerHeight) {
      return;
    }

    const format = new Intl.NumberFormat(localeTag, {
      maximumFractionDigits: Number.isInteger(to) ? 0 : 1,
    });
    const write = (value: number) => {
      element.textContent = `${prefix}${format.format(value)}${suffix}`;
    };

    write(0);

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        observer.disconnect();

        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / DURATION_MS);
          const eased = 1 - (1 - progress) ** 4;

          write(progress === 1 ? to : to * eased);

          if (progress < 1) frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      write(to);
    };
  }, [to, prefix, suffix, localeTag]);

  return (
    <span ref={ref}>
      {prefix}
      {new Intl.NumberFormat(localeTag).format(to)}
      {suffix}
    </span>
  );
}
