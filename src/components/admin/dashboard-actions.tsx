'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import { revalidateAllAction } from '@/lib/admin/actions';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast-store';

export function DashboardActions() {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await revalidateAllAction();
            toast('Public pages refreshed', 'success');
          } catch {
            toast('Could not refresh the public pages', 'error');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Refreshing…' : 'Revalidate all public pages'}
      </Button>
      <Link
        href="/"
        target="_blank"
        prefetch={false}
        className={cn(buttonVariants({ variant: 'secondary' }))}
      >
        Open public site
        <span className="sr-only"> (opens in a new tab)</span>
      </Link>
    </div>
  );
}
