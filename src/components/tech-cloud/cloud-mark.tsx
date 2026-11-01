import { cn } from '@/lib/cn';
import { type PublicTechIcon, withFill } from '@/lib/content/icon-src';
import { cloudIconFill } from '@/lib/tech-cloud/geoid';

/** Brand-colored glyph for the geoid (D37). List view keeps single-tone TechIcon. */
export function CloudMark({
  icon,
  brandColor,
  className,
}: {
  icon: PublicTechIcon;
  brandColor?: string;
  className?: string;
}) {
  const fill = cloudIconFill(brandColor);
  if ('monogram' in icon) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-[6px] border border-current font-mono text-[0.625rem] leading-none font-semibold max-[640px]:size-7',
          className,
        )}
        style={{ color: fill }}
      >
        {icon.monogram}
      </span>
    );
  }
  return (
    // A plain <img> rasterizes once like the prototype; next/image would only
    // add a wrapper and an optimizer round trip for a tiny cached SVG (D59).
    // eslint-disable-next-line @next/next/no-img-element -- D37 geoid compositor path
    <img
      src={withFill(icon.src, fill)}
      alt=""
      draggable={false}
      className={cn('size-8 object-contain max-[640px]:size-7', className)}
    />
  );
}
