'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { getSessionStatus, logout, renewSession } from '@/lib/auth/actions';

const WARN_MS = 2 * 60_000;

/**
 * Countdown, the WCAG 2.2.1 expiry warning and Sign out.
 */
export function SessionControls({ expiresAt: initial }: { expiresAt: number }) {
  const [expiresAt, setExpiresAt] = useState(initial);
  const [now, setNow] = useState(initial - 30 * 60_000);
  const [warning, setWarning] = useState(false);
  // Leaving the admin crosses root layouts, which Next does as a full load.
  const router = useRouter();

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 15_000);

    return () => window.clearInterval(tick);
  }, []);

  // The cookie may have been renewed by navigation; ask before warning.
  useEffect(() => {
    const wait = Math.max(0, expiresAt - WARN_MS - Date.now());
    const timer = window.setTimeout(async () => {
      const status = await getSessionStatus();

      if (!status.isAdmin) return router.replace('/');

      if (status.expiresAt - Date.now() > WARN_MS) setExpiresAt(status.expiresAt);
      else setWarning(true);
    }, wait);

    return () => window.clearTimeout(timer);
  }, [expiresAt, router]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => router.replace('/'),
      Math.max(0, expiresAt - Date.now()) + 1000,
    );

    return () => window.clearTimeout(timer);
  }, [expiresAt, router]);

  const minutes = Math.max(0, Math.ceil((expiresAt - now) / 60_000));

  async function stay() {
    const status = await renewSession();

    if (status.isAdmin) setExpiresAt(status.expiresAt);

    setWarning(false);
  }

  async function signOut() {
    await logout();
    router.replace('/');
  }

  return (
    <>
      <span className="font-mono text-xs text-text-3">Session · {minutes} min</span>
      <Button variant="secondary" size="sm" onClick={signOut}>
        Sign out
      </Button>
      <Dialog
        open={warning}
        onClose={() => setWarning(false)}
        title="Your session expires soon"
        closeLabel="Close"
      >
        <p className="mb-6">You will be signed out in about two minutes.</p>
        <Button onClick={stay}>Stay signed in</Button>
      </Dialog>
    </>
  );
}
