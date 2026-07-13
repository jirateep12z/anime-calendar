import { Slot } from 'radix-ui';

import {
  button_group_variants,
  type ButtonGroupVariantsProps
} from '@/components/ui/button-group-variants';
import { Separator } from '@/components/ui/separator';
import { Cn } from '@/lib/utils';

function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<'div'> & ButtonGroupVariantsProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={Cn(button_group_variants({ orientation }), className)}
      {...props}
    />
  );
}

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'div';

  return (
    <Comp
      className={Cn(
        "bg-muted flex items-center gap-2 rounded-md border px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={Cn(
        'bg-input relative self-stretch data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto',
        className
      )}
      {...props}
    />
  );
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  button_group_variants as buttonGroupVariants
};
