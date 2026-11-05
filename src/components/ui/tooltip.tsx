'use client';

import {
  cloneElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/cn';

interface TooltipProps {
  /**
   * A single focusable element (button or link).
   */
  children: ReactElement<{ 'aria-describedby'?: string }>;
  className?: string;
  content: ReactNode;
  side?: 'bottom' | 'top';
}

const HIDE_DELAY_MS = 120;

/**
 * Supplementary description shown on hover and focus (WCAG 1.4.13): dismissible
 * with Esc, hoverable, and persistent while hovered or focused. The trigger
 * keeps its own accessible name; the tooltip only describes it.
 */
export function Tooltip({
  content,
  children,
  side = 'bottom',
  className,
}: TooltipProps): React.JSX.Element {
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) return;

    let timer: number | undefined;

    const show = (): void => {
      window.clearTimeout(timer);
      setOpen(true);
    };
    const hide = (): void => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setOpen(false), HIDE_DELAY_MS);
    };
    // Pointer events cover the trigger and the bubble (hoverable content);
    // focus events bubble up from the trigger.
    const onPointerEnter = (event: PointerEvent): void => {
      if (event.pointerType === 'mouse') show();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };

    wrapper.addEventListener('pointerenter', onPointerEnter);
    wrapper.addEventListener('pointerleave', hide);
    wrapper.addEventListener('focusin', show);
    wrapper.addEventListener('focusout', hide);
    document.addEventListener('keydown', onKeyDown);

    return (): void => {
      window.clearTimeout(timer);
      wrapper.removeEventListener('pointerenter', onPointerEnter);
      wrapper.removeEventListener('pointerleave', hide);
      wrapper.removeEventListener('focusin', show);
      wrapper.removeEventListener('focusout', hide);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <span ref={wrapperRef} className="relative inline-flex">
      {/* eslint-disable-next-line @eslint-react/no-clone-element -- the tooltip must add aria-describedby to its single, arbitrary child */}
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'absolute left-1/2 z-(--z-floating) w-max max-w-64 -translate-x-1/2 rounded-sm border border-line-strong bg-surface-2 px-2.5 py-1.5',
          'text-small text-text-1 shadow-lg transition-[opacity,translate] duration-150 ease-out-expo',
          side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-0.5 opacity-0',
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
