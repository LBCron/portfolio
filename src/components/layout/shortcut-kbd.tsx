'use client';

import { Kbd } from '@/components/ui/kbd';

import { useShortcutLabel } from './use-shortcut-label';

export function ShortcutKbd(): React.JSX.Element {
  return <Kbd>{useShortcutLabel()}</Kbd>;
}
