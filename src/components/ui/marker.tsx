import type { MarkerVariantsProps } from '@/components/ui/marker-variants';
import { marker_variants } from '@/components/ui/marker-variants';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { Cn } from '@/lib/utils';

function Marker({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  MarkerVariantsProps & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      data-slot="marker"
      data-variant={variant}
      className={Cn(marker_variants({ variant, className }))}
      {...props}
    />
  );
}

function MarkerIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={Cn(
        "size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function MarkerContent({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-content"
      className={Cn(
        '*:[a]:hover:text-foreground min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-3',
        className
      )}
      {...props}
    />
  );
}

export { Marker, marker_variants, MarkerContent, MarkerIcon };
