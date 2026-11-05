import { icons, Link as LinkGlyph, type LucideIcon } from 'lucide-react';
import { createElement } from 'react';

import { cn } from '@/lib/cn';
import { type LinkIcon as LinkIconData } from '@/lib/content';

function lucideFor(name: string): LucideIcon {
  const pascal = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return icons[pascal as keyof typeof icons] ?? LinkGlyph;
}

/**
 * Decorative icon for a featured link; the link carries the name.
 */
export function LinkIcon({
  icon,
  className,
}: {
  className?: string;
  icon: LinkIconData;
}): React.JSX.Element {
  if (icon.type === 'lucide') {
    return createElement(lucideFor(icon.name), {
      'aria-hidden': true,
      'focusable': false,
      'className': cn('size-4', className),
    });
  }

  return (
    <svg
      viewBox={icon.viewBox}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      className={cn('size-4', className)}
    >
      {icon.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
