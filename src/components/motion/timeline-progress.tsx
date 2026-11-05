'use client';

import { type ReactNode, useEffect, useRef } from 'react';

import { useReducedMotionPreference } from '@/lib/motion-preference';

/**
 * Wraps the experience timeline: the rail draws with scroll (scaleY) and each
 * `[data-timeline-node]` pulses once when the rail reaches it. Without JS, or
 * with reduced motion, the rail is simply drawn.
 */
export function TimelineProgress({ children }: { children: ReactNode }): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();

  useEffect(() => {
    const root = rootRef.current;
    const rail = railRef.current;

    if (!root || !rail) return;

    if (reduced) {
      rail.style.transform = '';

      return;
    }

    let frame = 0;
    const update = (): void => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const anchor = window.innerHeight * 0.6;
      const progress = Math.min(1, Math.max(0, (anchor - rect.top) / Math.max(rect.height, 1)));
      rail.style.transform = `scaleY(${progress})`;
    };
    const onScroll = (): void => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const nodes = root.querySelectorAll<HTMLElement>('[data-timeline-node]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          (entry.target as HTMLElement).dataset.reached = 'true';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -40% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return (): void => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className="relative">
      <div
        aria-hidden="true"
        className="decorative absolute top-2 bottom-2 left-[7px] w-px bg-line"
      >
        <div
          ref={railRef}
          className="h-full w-full origin-top bg-[linear-gradient(to_bottom,#8b7cff,#4cc9f0)]"
        />
      </div>
      {children}
    </div>
  );
}
