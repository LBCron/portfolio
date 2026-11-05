'use client';

import Link from 'next/link';
import { useState } from 'react';

import { reorderAction, setFlagAction } from '@/lib/admin/actions';
import { moveItem } from '@/lib/admin/path';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast-store';

import { inputClass, smallButton } from './editor/styles';

export interface ListRow {
  /**
   * First cell is the row's link.
   */
  cells: string[];
  featured?: boolean;
  href: string;
  id: string;
  rev: string | undefined;
  visible: boolean;
}

interface CollectionListProps {
  columns: string[];
  /**
   * Column indexes that get a filter menu.
   */
  filterColumns?: number[];
  hasFeatured?: boolean;
  newHref: string;
  plural: string;
  readOnly: boolean;
  rows: ListRow[];
  singular: string;
  type: string;
}

/**
 * Searchable, filterable table with visibility and featured toggles and
 * reordering.
 */
export function CollectionList({
  type,
  singular,
  plural,
  columns,
  rows: initial,
  newHref,
  filterColumns = [],
  hasFeatured,
  readOnly,
}: CollectionListProps): React.JSX.Element {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [dragging, setDragging] = useState<null | string>(null);

  const filtered = rows.filter(
    (row) =>
      row.cells.join(' ').toLowerCase().includes(query.toLowerCase())
      && filterColumns.every((column) => !filters[column] || row.cells[column] === filters[column]),
  );
  const narrowed = filtered.length !== rows.length;

  async function toggle(row: ListRow, field: 'featured' | 'visible'): Promise<void> {
    const next = !row[field];
    const before = rows;

    setRows((current) =>
      current.map((item) => (item.id === row.id ? { ...item, [field]: next } : item)),
    );

    try {
      const result = await setFlagAction(type, row.id, field, next, row.rev);

      if (!result.ok) throw new Error(result.kind);

      setRows((current) =>
        current.map((item) => (item.id === row.id ? { ...item, rev: result.rev } : item)),
      );
    } catch {
      setRows(before);
      toast('Could not update. Reload and try again.', 'error');
    }
  }

  async function move(id: string, to: number): Promise<void> {
    const from = rows.findIndex((row) => row.id === id);

    if (from === to || to < 0 || to >= rows.length) return;

    const before = rows;
    const next = moveItem(rows, from, to);

    setRows(next);

    try {
      const result = await reorderAction(
        type,
        next.map((row) => row.id),
      );

      if (!result.ok) throw new Error(result.kind);

      // Revisions changed server-side; the next toggle would conflict, so refresh them.
      setRows((current) => current.map((row) => ({ ...row, rev: undefined })));
      toast('Order saved', 'success');
    } catch {
      setRows(before);
      toast('Could not save the order', 'error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="list-search" className="text-small text-text-2">
            Search {plural}
          </label>
          <input
            id="list-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={inputClass}
          />
        </div>
        {filterColumns.map((column) => (
          <div key={column} className="flex flex-col gap-1">
            <label htmlFor={`filter-${column}`} className="text-small text-text-2">
              {columns[column]}
            </label>
            <select
              id={`filter-${column}`}
              value={filters[column] ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  [column]: event.target.value,
                }))
              }
              className={inputClass}
            >
              <option value="">All</option>
              {[...new Set(rows.map((row) => row.cells[column] ?? ''))].sort().map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ))}
        <Link
          href={newHref}
          prefetch={false}
          aria-disabled={readOnly || undefined}
          className={cn(
            smallButton,
            'bg-text-1 text-bg-0',
            readOnly && 'pointer-events-none opacity-40',
          )}
        >
          New {singular}
        </Link>
      </div>

      {narrowed ? (
        <p className="text-small text-text-3">
          Reordering is available when no search or filter is active.
        </p>
      ) : null}

      <div
        role="region"
        aria-label={`${plural} table`}
        // A horizontally scrollable region must be reachable by keyboard.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="overflow-x-auto rounded-lg border border-line"
      >
        <table className="w-full min-w-max text-left text-small">
          <caption className="sr-only">{plural}</caption>
          <thead className="border-b border-line text-text-3">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-3 py-2 font-medium">
                  {column}
                </th>
              ))}
              {hasFeatured ? (
                <th scope="col" className="px-3 py-2 font-medium">
                  Featured
                </th>
              ) : null}
              <th scope="col" className="px-3 py-2 font-medium">
                Visible
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Order
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3} className="px-3 py-6 text-text-3">
                  Nothing here yet.
                </td>
              </tr>
            ) : null}
            {filtered.map((row) => {
              const index = rows.findIndex((item) => item.id === row.id);

              return (
                <tr
                  key={row.id}
                  data-row={row.id}
                  onDragOver={(event) => dragging && event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();

                    if (dragging) move(dragging, index);

                    setDragging(null);
                  }}
                  className={cn(
                    'border-b border-line last:border-0',
                    dragging === row.id && 'opacity-50',
                  )}
                >
                  {row.cells.map((cell, position) => (
                    <td key={position} className="px-3 py-2">
                      {position === 0 ? (
                        <Link
                          href={row.href}
                          prefetch={false}
                          className="font-medium text-text-1 underline-offset-4 hover-fine:underline"
                        >
                          {cell || '(untitled)'}
                        </Link>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                  {hasFeatured ? (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Featured: ${row.cells[0] ?? row.id}`}
                        checked={row.featured === true}
                        disabled={readOnly}
                        onChange={() => {
                          toggle(row, 'featured');
                        }}
                        className="size-5 accent-accent-1"
                      />
                    </td>
                  ) : null}
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`Visible: ${row.cells[0] ?? row.id}`}
                      checked={row.visible}
                      disabled={readOnly}
                      onChange={() => {
                        toggle(row, 'visible');
                      }}
                      className="size-5 accent-accent-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span
                        aria-hidden="true"
                        draggable={!readOnly && !narrowed}
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = 'move';
                          event.dataTransfer.setData('text/plain', row.id);
                          setDragging(row.id);
                        }}
                        onDragEnd={() => setDragging(null)}
                        className="hidden cursor-grab px-1 text-text-3 select-none md:inline"
                      >
                        ⠿
                      </span>
                      <button
                        type="button"
                        aria-label={`Move ${row.cells[0] ?? row.id} up`}
                        disabled={readOnly || narrowed || index === 0}
                        onClick={() => {
                          move(row.id, index - 1);
                        }}
                        className={smallButton}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${row.cells[0] ?? row.id} down`}
                        disabled={readOnly || narrowed || index === rows.length - 1}
                        onClick={() => {
                          move(row.id, index + 1);
                        }}
                        className={smallButton}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
