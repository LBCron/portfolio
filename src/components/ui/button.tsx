import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  [
    'group/button relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full',
    'font-medium whitespace-nowrap select-none',
    'transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out-expo',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-text-1 text-bg-0 shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_8px_24px_-8px_rgb(139_124_255/0.45)] hover-fine:bg-white',
        secondary:
          'border border-line-strong bg-transparent text-text-1 hover-fine:border-text-3 hover-fine:bg-surface-1',
        ghost: 'text-text-2 hover-fine:bg-surface-1 hover-fine:text-text-1',
      },
      size: {
        sm: 'min-h-11 px-4 text-small',
        md: 'px-5 text-small sm:px-6',
        icon: 'size-11 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonVariantProps & ComponentProps<'button'>) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

/**
 * Internal, locale-aware link styled as a button.
 */
export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ButtonVariantProps & ComponentProps<typeof Link>) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/**
 * Plain anchor styled as a button (hash links, external URLs, files).
 */
export function ButtonAnchor({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonVariantProps & ComponentProps<'a'>) {
  return (
    <a className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </a>
  );
}
