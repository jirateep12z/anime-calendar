import { Slot } from 'radix-ui';
import * as React from 'react';

import {
  button_variants,
  type ButtonVariantsProps
} from '@/components/ui/button-variants';
import { Cn } from '@/lib/utils';

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  ButtonVariantsProps & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={Cn(button_variants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, button_variants as buttonVariants };
