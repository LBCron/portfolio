import type { PublicTechIcon } from '@/lib/content/icon-src';
import type { Technology } from '@/lib/content/types';

/** A technology as the stack's client components receive it (D59). */
export type StackTech = Omit<Technology, 'icon' | 'order'> & {
  icon: PublicTechIcon;
};
