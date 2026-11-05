'use client';

import { type DragEvent, type ReactNode, useState } from 'react';

import { fieldId, moveItem, removeItem } from '@/lib/admin/path';
import { cn } from '@/lib/cn';

import { useForm } from './form';
import { hintClass, labelClass, smallButton } from './styles';

interface ListEditorProps {
  children: (index: number, itemPath: string) => ReactNode;
  hint?: ReactNode;
  /**
   * Singular noun for buttons: "highlight", "role".
   */
  itemLabel: string;
  label: string;
  max?: number;
  min?: number;
  newItem: () => unknown;
  path: string;
}

/**
 * Add, remove and reorder rows. Up/down buttons are the accessible path;
 * dragging the handle is a pointer extra on desktop.
 */
export function ListEditor({
  path,
  label,
  itemLabel,
  newItem,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  hint,
  children,
}: ListEditorProps): React.JSX.Element {
  const form = useForm();
  const items = (form.get(path) as undefined | unknown[]) ?? [];
  const [dragging, setDragging] = useState<null | number>(null);
  const error = form.error(path);
  const id = fieldId(path);

  function move(from: number, to: number): void {
    form.set(path, moveItem(items, from, to));
    // Keep the keyboard on the row that moved.
    requestAnimationFrame(() => {
      const kind = to < from ? 'up' : 'down';

      document
        .querySelector<HTMLButtonElement>(`[data-row="${path}.${to}"] [data-move="${kind}"]`)
        ?.focus();
    });
  }

  function onDrop(event: DragEvent, to: number): void {
    event.preventDefault();

    if (dragging !== null) move(dragging, to);

    setDragging(null);
  }

  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-describedby={error ? `${id}-error` : undefined}
      className="flex flex-col gap-3 outline-none"
    >
      <legend className={labelClass}>
        {label}{' '}
        <span className="font-normal text-text-3">
          ({items.length}
          {Number.isFinite(max) ? `/${max}` : ''})
        </span>
      </legend>
      {hint ? <p className={hintClass}>{hint}</p> : null}

      <ol className="flex flex-col gap-3">
        {items.map((_, index) => (
          // Dragging is a pointer extra; the up/down buttons are the keyboard path.
          // eslint-disable-next-line jsx-a11y-x/no-noninteractive-element-interactions
          <li
            key={index}
            data-row={`${path}.${index}`}
            onDragOver={(event) => dragging !== null && event.preventDefault()}
            onDrop={(event) => onDrop(event, index)}
            className={cn(
              'flex flex-col gap-4 rounded-lg border border-line bg-surface-1/40 p-4',
              dragging === index && 'opacity-50',
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                aria-hidden="true"
                draggable={!form.disabled}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', String(index));
                  setDragging(index);
                }}
                onDragEnd={() => setDragging(null)}
                className="hidden cursor-grab px-1 text-text-3 select-none md:inline hover-fine:text-text-1"
              >
                ⠿
              </span>
              <span className="mr-auto text-small font-medium text-text-2">
                {itemLabel} {index + 1}
              </span>
              <button
                type="button"
                data-move="up"
                aria-label={`Move ${itemLabel} ${index + 1} up`}
                disabled={form.disabled || index === 0}
                onClick={() => move(index, index - 1)}
                className={smallButton}
              >
                ↑
              </button>
              <button
                type="button"
                data-move="down"
                aria-label={`Move ${itemLabel} ${index + 1} down`}
                disabled={form.disabled || index === items.length - 1}
                onClick={() => move(index, index + 1)}
                className={smallButton}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Remove ${itemLabel} ${index + 1}`}
                disabled={form.disabled || items.length <= min}
                onClick={() => form.set(path, removeItem(items, index))}
                className={smallButton}
              >
                Remove
              </button>
            </div>
            {children(index, `${path}.${index}`)}
          </li>
        ))}
      </ol>

      <div>
        <button
          type="button"
          disabled={form.disabled || items.length >= max}
          onClick={() => form.set(path, [...items, newItem()])}
          className={smallButton}
        >
          Add {itemLabel}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
