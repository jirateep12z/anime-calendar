import type { BadgeVariantsProps } from '@/components/ui/badge-variants';
import { badge_variants } from '@/components/ui/badge-variants';
import * as React from 'react';

import { Cn } from '@/lib/utils';
import { Slot } from 'radix-ui';

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & BadgeVariantsProps & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={Cn(badge_variants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badge_variants };
