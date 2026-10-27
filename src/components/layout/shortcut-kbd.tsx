'use client';

import { Kbd } from '@/components/ui/kbd';

import { useShortcutLabel } from './use-shortcut-label';

export function ShortcutKbd() {
  return <Kbd>{useShortcutLabel()}</Kbd>;
}
