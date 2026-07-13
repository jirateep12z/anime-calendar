import * as React from 'react';

import {
  alert_variants,
  type AlertVariantsProps
} from '@/components/ui/alert-variants';
import { Cn } from '@/lib/utils';

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & AlertVariantsProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={Cn(alert_variants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={Cn(
        '[&_a]:hover:text-foreground font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3',
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={Cn(
        'text-muted-foreground [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4',
        className
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={Cn('absolute top-2.5 right-3', className)}
      {...props}
    />
  );
}

export {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  alert_variants as alertVariants
};
