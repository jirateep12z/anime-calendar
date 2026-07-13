import type {
  AttachmentMediaVariantsProps,
  AttachmentVariantsProps
} from '@/components/ui/attachment-variants';
import {
  attachment_media_variants,
  attachment_variants
} from '@/components/ui/attachment-variants';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Cn } from '@/lib/utils';

function Attachment({
  className,
  state = 'done',
  size = 'default',
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<'div'> &
  AttachmentVariantsProps & {
    state?: 'idle' | 'uploading' | 'processing' | 'error' | 'done';
  }) {
  return (
    <div
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      className={Cn(attachment_variants({ size, orientation }), className)}
      {...props}
    />
  );
}

function AttachmentMedia({
  className,
  variant = 'icon',
  ...props
}: React.ComponentProps<'div'> & AttachmentMediaVariantsProps) {
  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={Cn(attachment_media_variants({ variant }), className)}
      {...props}
    />
  );
}

function AttachmentContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-content"
      className={Cn(
        'max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1',
        className
      )}
      {...props}
    />
  );
}

function AttachmentTitle({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="attachment-title"
      className={Cn(
        'group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer block max-w-full min-w-0 truncate font-medium',
        className
      )}
      {...props}
    />
  );
}

function AttachmentDescription({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="attachment-description"
      className={Cn(
        'text-muted-foreground group-data-[state=error]/attachment:text-destructive/80 mt-0.5 block min-w-0 truncate text-xs',
        'max-w-full',
        className
      )}
      {...props}
    />
  );
}

function AttachmentActions({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-actions"
      className={Cn(
        'relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1',
        className
      )}
      {...props}
    />
  );
}

function AttachmentAction({
  className,
  variant,
  size = 'icon-xs',
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="attachment-action"
      variant={variant ?? 'ghost'}
      size={size}
      className={Cn(className)}
      {...props}
    />
  );
}

function AttachmentTrigger({
  className,
  asChild = false,
  type,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="attachment-trigger"
      type={asChild ? undefined : (type ?? 'button')}
      className={Cn('absolute inset-0 z-10 outline-none', className)}
      {...props}
    />
  );
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-group"
      className={Cn(
        'scroll-fade-x flex min-w-0 snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start',
        className
      )}
      {...props}
    />
  );
}

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger
};
