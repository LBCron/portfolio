'use client';

import { type ComponentProps, type PointerEvent, useRef } from 'react';

import { cn } from '@/lib/cn';

import { cardSurface } from './card-styles';

const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/**
 * Surface card with a pointer-tracked spotlight border. The spotlight only runs
 * for fine pointers and writes CSS variables, never React state.
 */
export function Card({ className, children, onPointerMove, ...props }: ComponentProps<'div'>) {
  const ref = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    onPointerMove?.(event);

    const element = ref.current;

    if (!element || !window.matchMedia(FINE_POINTER).matches) return;

    const rect = element.getBoundingClientRect();

    element.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    element.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={cn(cardSurface, className)}
      {...props}
    >
      {children}
    </div>
  );
}
