'use client';

import { useEffect, useRef } from 'react';

import { useReducedMotionPreference } from '@/lib/motion-preference';

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const EASE = 0.12;

/**
 * Aurora blobs (CSS loops), a masked grid and a pointer-following spotlight.
 * The loops pause while the hero is off screen; the spotlight runs a rAF loop
 * only while it is catching up with the pointer.
 */
export function HeroBackdrop(): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();

  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const observer = new IntersectionObserver(([entry]) => {
      root.dataset.paused = entry?.isIntersecting ? 'false' : 'true';
    });

    observer.observe(root);

    return (): void => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const spot = spotRef.current;

    if (!root || !spot || reduced) return;

    if (!window.matchMedia(FINE_POINTER).matches) return;

    const target = { x: 0.5, y: 0.35 };
    const current = { ...target };
    let frame = 0;

    const render = (): void => {
      current.x += (target.x - current.x) * EASE;
      current.y += (target.y - current.y) * EASE;
      spot.style.transform = `translate3d(${(current.x - 0.5) * 100}%, ${(current.y - 0.5) * 100}%, 0)`;
      const settled =
        Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001;

      frame = settled ? 0 : requestAnimationFrame(render);
    };
    const onPointerMove = (event: PointerEvent): void => {
      if (root.dataset.paused === 'true') return;

      const rect = root.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = (event.clientY - rect.top) / rect.height;
      spot.style.opacity = '1';

      if (!frame) frame = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return (): void => {
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="hero-backdrop decorative pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="hero-blob hero-blob-a" />
      <div className="hero-blob hero-blob-b" />
      <div className="hero-grid absolute inset-0" />
      <div ref={spotRef} className="absolute inset-0 opacity-0 transition-opacity duration-700">
        <div className="absolute top-1/2 left-1/2 size-[36rem] -translate-1/2 rounded-full bg-[radial-gradient(circle,rgb(139_124_255/0.16),transparent_65%)]" />
      </div>
    </div>
  );
}
