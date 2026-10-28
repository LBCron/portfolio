'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

import { ADMIN_NAV } from './areas';

const itemClass =
  'inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-small';

/** Sidebar on desktop, a scrolling tab bar on mobile (one component, two placements). */
export function AdminNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin areas" className={className}>
      <ul className="flex gap-1 md:flex-col md:p-2">
        {ADMIN_NAV.map((item) => {
          const current =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                prefetch={false}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  itemClass,
                  current
                    ? 'bg-surface-2 text-text-1'
                    : 'text-text-2 hover-fine:text-text-1',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
