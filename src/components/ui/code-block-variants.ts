import { cva, type VariantProps } from 'class-variance-authority';

const code_block_variants = cva(
  'group/code-block relative flex w-full min-w-0 flex-col overflow-hidden rounded-lg text-sm has-[>[data-slot=code-block-content]:focus-visible]:ring-3 has-[>[data-slot=code-block-content]:focus-visible]:ring-ring/50 data-[size=sm]:text-xs',
  {
    variants: {
      variant: {
        default:
          'border border-input text-foreground has-[>[data-slot=code-block-content]:focus-visible]:border-ring dark:bg-input/30',
        destructive:
          'border border-destructive/30 text-destructive dark:border-destructive/40'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

const code_block_line_variants = cva(
  "relative -mx-4 block min-h-lh px-4 group-data-[size=sm]/code-block:-mx-3 group-data-[size=sm]/code-block:px-3 before:min-w-6 before:text-end before:text-muted-foreground after:absolute after:start-1 after:top-0 after:text-muted-foreground after:select-none in-data-numbered:col-span-2 in-data-numbered:grid in-data-numbered:grid-cols-subgrid in-data-numbered:gap-x-3 in-data-numbered:[counter-increment:line] in-data-numbered:before:content-[counter(line)] in-data-numbered:before:select-none in-data-numbered:supports-[content:counter(line)_/_'']:before:content-[counter(line)_/_'']",
  {
    variants: {
      variant: {
        default: '',
        added: "bg-muted after:content-['+']",
        removed: "bg-destructive/10 after:text-destructive after:content-['−']",
        highlighted: 'bg-muted'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

type CodeBlockVariantsProps = VariantProps<typeof code_block_variants>;
type CodeBlockLineVariantsProps = VariantProps<typeof code_block_line_variants>;

export { code_block_line_variants, code_block_variants };
export type { CodeBlockLineVariantsProps, CodeBlockVariantsProps };
