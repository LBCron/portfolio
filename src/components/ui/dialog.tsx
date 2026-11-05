'use client';

import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import { cn } from '@/lib/cn';

interface DialogProps {
  children: ReactNode;
  className?: string;
  closeLabel: string;
  /**
   * Visually hide the title (it still names the dialog).
   */
  hideTitle?: boolean;
  onClose: () => void;
  open: boolean;
  title: ReactNode;
}

/**
 * Native modal `<dialog>`: the browser provides the focus trap, Esc handling,
 * inert background and focus restoration to the trigger on close.
 */
export function Dialog({
  open,
  onClose,
  title,
  closeLabel,
  children,
  className,
  hideTitle,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();

    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Backdrop clicks are a pointer convenience; Esc and the close button are
  // the keyboard paths. A click on the backdrop targets the dialog itself.
  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) return;

    const onClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose();
    };

    dialog.addEventListener('click', onClick);

    return () => dialog.removeEventListener('click', onClick);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={cn(
        'm-auto max-h-[min(90dvh,48rem)] w-[min(40rem,calc(100%-2rem))] rounded-xl border border-line-strong bg-surface-1 p-0 text-text-2',
        'shadow-(--shadow-window) backdrop:bg-black/70 backdrop:backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-0">
        <h2 id={titleId} className={cn('text-h3', hideTitle && 'sr-only')}>
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="-mt-2 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text-2 hover-fine:bg-surface-2 hover-fine:text-text-1"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
