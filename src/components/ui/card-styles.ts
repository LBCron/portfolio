/**
 * Card surface with the pointer-tracked spotlight border (`--mx`/`--my`).
 * Hook-free so Server Components can use it; `Card` and `Tilt` set the vars.
 */
export const cardSurface = [
  'card group/card relative isolate rounded-lg border border-line bg-surface-1 shadow-(--shadow-card-inset)',
  // Spotlight border: a radial gradient masked to the 1px border ring.
  'before:pointer-events-none before:absolute before:-inset-px before:-z-10 before:rounded-[inherit] before:opacity-0',
  'before:bg-[radial-gradient(320px_circle_at_var(--mx,50%)_var(--my,50%),rgb(139_124_255/0.55),rgb(76_201_240/0.25)_40%,transparent_70%)]',
  'before:p-px before:transition-opacity before:duration-300 before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]',
  'hover-fine:before:opacity-100',
].join(' ');
