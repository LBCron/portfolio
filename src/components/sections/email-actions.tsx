'use client';

import { Copy, Mail } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { toast } from '@/stores/toast-store';

interface EmailActionsProps {
  domain: string;
  labels: { copied: string; copy: string; copyFailed: string };
  /**
   * Address parts; joined only in the browser to deter scrapers.
   */
  user: string;
}

const subscribe = () => (): void => {};

/**
 * `mailto:` link plus a copy button. The address is assembled after hydration;
 * the server renders an invisible placeholder of the same size and the section
 * provides a `<noscript>` fallback.
 */
export function EmailActions({ user, domain, labels }: EmailActionsProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const address = `${user}@${domain}`;

  if (!isClient) {
    return <span aria-hidden="true" className="block min-h-14" />;
  }

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(address);
      track('email_copy');
      toast(labels.copied, 'success');
    } catch {
      toast(labels.copyFailed, 'error');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={`mailto:${address}`}
        className={cn(buttonVariants({ variant: 'primary' }), 'min-h-14 px-6 text-base sm:text-lg')}
      >
        <Mail aria-hidden="true" className="size-5!" />
        {address}
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={labels.copy}
        title={labels.copy}
        className={cn(buttonVariants({ variant: 'secondary', size: 'icon' }), 'size-14')}
      >
        <Copy aria-hidden="true" className="size-5!" />
      </button>
    </div>
  );
}
