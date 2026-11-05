'use client';

import { useEffect, useState } from 'react';

import { useSessionStore } from '@/stores/session-store';

/**
 * Remaining admin time in the title bar; renders nothing for visitors.
 */
export function SessionPill(): null | React.JSX.Element {
  const session = useSessionStore((state) => state.session);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!session) return;

    const tick = (): void => setNow(Date.now());

    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 15_000);

    return (): void => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [session]);

  if (!session) return null;

  const minutes = now ? Math.max(0, Math.ceil((session.expiresAt - now) / 60_000)) : '';

  return (
    <span
      data-session-pill
      className="rounded-full border border-danger/50 px-2 py-0.5 font-mono text-[11px] text-danger"
    >
      session{minutes === '' ? '' : ` · ${minutes}m`}
    </span>
  );
}
