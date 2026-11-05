import { type LucideIcon, type LucideProps } from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
  /**
   * Accessible name. Omit for decorative icons next to visible text.
   */
  label?: string;
}

export function Icon({ icon: Glyph, label, ...props }: IconProps): React.JSX.Element {
  if (label) {
    return <Glyph role="img" aria-label={label} focusable="false" {...props} />;
  }

  return <Glyph aria-hidden="true" focusable="false" {...props} />;
}
