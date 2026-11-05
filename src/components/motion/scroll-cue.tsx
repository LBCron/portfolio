'use client';

import { ArrowDown } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * Hint to scroll that fades out over the first 240px of scroll.
 */
export function ScrollCue({ href, label }: { href: string; label: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    let frame = 0;
    const update = (): void => {
      frame = 0;
      const opacity = Math.max(0, 1 - window.scrollY / 240);
      element.style.opacity = `${opacity}`;
      element.style.visibility = opacity === 0 ? 'hidden' : 'visible';
    };
    const onScroll = (): void => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });

    return (): void => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <a
      ref={ref}
      href={href}
      aria-label={label}
      className="group/cue inline-flex size-11 items-center justify-center rounded-full border border-line text-text-3 transition-colors hover-fine:border-line-strong hover-fine:text-text-1"
    >
      <ArrowDown
        aria-hidden="true"
        className="size-4 motion-safe:animate-[cue-bob_2.4s_var(--ease-out-expo)_3]"
      />
    </a>
  );
}
