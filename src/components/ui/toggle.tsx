import { Toggle as TogglePrimitive } from 'radix-ui';
import * as React from 'react';

import {
  toggle_variants,
  type ToggleVariantsProps
} from '@/components/ui/toggle-variants';
import { Cn } from '@/lib/utils';

function Toggle({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & ToggleVariantsProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={Cn(toggle_variants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggle_variants as toggleVariants };
