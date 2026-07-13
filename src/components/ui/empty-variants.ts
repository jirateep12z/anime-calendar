import { cva, type VariantProps } from 'class-variance-authority';

const empty_media_variants = cva(
  'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6"
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

type EmptyMediaVariantsProps = VariantProps<typeof empty_media_variants>;

export { empty_media_variants, type EmptyMediaVariantsProps };
