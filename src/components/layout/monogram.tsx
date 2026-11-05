import { useId } from 'react';

import { cn } from '@/lib/cn';

/**
 * "JM" mark. Decorative: the surrounding link carries the accessible name.
 */
export function Monogram({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn('size-8 shrink-0', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b7cff" />
          <stop offset="1" stopColor="#4cc9f0" />
        </linearGradient>
      </defs>
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="9"
        fill="#11141b"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
      />
      <path
        d="M13 9.5v8.75a4 4 0 0 1-7.2 2.4"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M17.5 22.5V9.5l4 7.5 4-7.5v13"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
