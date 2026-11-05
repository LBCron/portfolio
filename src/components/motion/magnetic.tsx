'use client';

import { type ReactNode, useEffect, useRef } from 'react';

import { useReducedMotionPreference } from '@/lib/motion-preference';

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const MAX_PULL = 8;

/**
 * Pulls its child toward the pointer by up to 8px (fine pointers only).
 */
export function Magnetic({ children }: { children: ReactNode }): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotionPreference();

  useEffect(() => {
    const element = ref.current;

    if (!element || reduced || !window.matchMedia(FINE_POINTER).matches) {
      return;
    }

    let frame = 0;
    let next = '';
    const write = (): void => {
      frame = 0;
      element.style.transform = next;
    };
    const schedule = (transform: string): void => {
      next = transform;

      if (!frame) frame = requestAnimationFrame(write);
    };
    const onMove = (event: PointerEvent): void => {
      const rect = element.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;

      schedule(
        `translate3d(${(dx * MAX_PULL * 2).toFixed(2)}px, ${(dy * MAX_PULL * 2).toFixed(2)}px, 0)`,
      );
    };
    const onLeave = (): void => schedule('');

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
    <span ref={ref} className="inline-flex transition-transform duration-300 ease-out-expo">
      {children}
    </span>
  );
}
