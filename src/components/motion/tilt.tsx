'use client';

import { type ReactNode, useEffect, useRef } from 'react';

import { cn } from '@/lib/cn';
import { useReducedMotionPreference } from '@/lib/motion-preference';

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const MAX_TILT_DEG = 6;

/**
 * Tilts (max 6°) and lifts its content toward the pointer. Also feeds the card
 * spotlight (`--mx`/`--my`). Fine pointers only; off for reduced motion.
 */
export function Tilt({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();

  useEffect(() => {
    const element = ref.current;

    if (!element || !window.matchMedia(FINE_POINTER).matches) return;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;

    const write = (): void => {
      frame = 0;

      if (!pointer) {
        element.style.transform = '';

        return;
      }

      const rect = element.getBoundingClientRect();
      const x = (pointer.x - rect.left) / rect.width;
      const y = (pointer.y - rect.top) / rect.height;

      element.style.setProperty('--mx', `${pointer.x - rect.left}px`);
      element.style.setProperty('--my', `${pointer.y - rect.top}px`);

      if (reduced) return;

      const rotateY = (x - 0.5) * 2 * MAX_TILT_DEG;
      const rotateX = (0.5 - y) * 2 * MAX_TILT_DEG;

      element.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(write);
    };
    const onMove = (event: PointerEvent): void => {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const onLeave = (): void => {
      pointer = null;
      schedule();
    };

    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);

    return (): void => {
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
      element.style.transform = '';
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-transform duration-300 ease-out-expo will-change-transform',
        className,
      )}
    >
      {children}
    </div>
  );
}
