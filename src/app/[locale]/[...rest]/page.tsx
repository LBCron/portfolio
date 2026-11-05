import { notFound } from 'next/navigation';

/**
 * Unknown localized paths get the localized 404 with a real 404 status.
 */
export default function CatchAllPage() {
  notFound();
}
