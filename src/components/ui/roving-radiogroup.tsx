'use client';

import { type ComponentProps, type KeyboardEvent, useEffect, useRef } from 'react';

const items = (root: HTMLElement | null): HTMLElement[] =>
  Array.from(root?.querySelectorAll<HTMLElement>('[role="radio"]') ?? []);

/**
 * A radiogroup of links (server-rendered, crawlable) with roving tabindex
 * (§14.2): the checked option is the single tab stop, arrows and Home/End move
 * focus, Enter or Space follows the link. Every option stays tabbable until
 * hydration, so keyboard users without JavaScript still reach them.
 */
export function RovingRadiogroup({
  children,
  ...props
}: Omit<ComponentProps<'div'>, 'onKeyDown' | 'ref' | 'role'>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const options = items(ref.current);
    const checked = options.findIndex((option) => option.getAttribute('aria-checked') === 'true');

    options.forEach((option, index) => {
      option.tabIndex = index === Math.max(checked, 0) ? 0 : -1;
    });
  });

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const options = items(ref.current);
    const current = options.indexOf(document.activeElement as HTMLElement);

    if (current === -1) return;

    if (event.key === ' ') {
      event.preventDefault();
      options[current]?.click();

      return;
    }

    const last = options.length - 1;
    const next = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowDown: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      ArrowUp: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[event.key];

    if (next === undefined) return;

    event.preventDefault();
    options[next]?.focus();
  }

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- focus lives on the radios inside
    <div ref={ref} role="radiogroup" onKeyDown={handleKeyDown} {...props}>
      {children}
    </div>
  );
}
