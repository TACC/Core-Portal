import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const markerVariants = cva(
  'tw:group/marker tw:relative tw:flex tw:min-h-4 tw:w-full tw:items-center tw:gap-2 tw:text-left tw:text-sm tw:text-muted-foreground tw:[&_svg:not([class*=size-])]:size-4 tw:[a]:underline tw:[a]:underline-offset-3 tw:[a]:hover:text-foreground',
  {
    variants: {
      variant: {
        default: 'tw:',
        separator:
          'tw:before:mr-1 tw:before:h-px tw:before:min-w-0 tw:before:flex-1 tw:before:bg-border tw:after:ml-1 tw:after:h-px tw:after:min-w-0 tw:after:flex-1 tw:after:bg-border',
        border: 'tw:border-b tw:border-border tw:pb-2',
      },
    },
  }
);

function Marker({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof markerVariants>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(markerVariants({ variant, className })),
      },
      props
    ),
    render,
    state: {
      slot: 'marker',
      variant,
    },
  });
}

function MarkerIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn(
        'tw:size-4 tw:shrink-0 tw:[&_svg:not([class*=size-])]:size-4',
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
      className={cn(
        'tw:min-w-0 tw:wrap-break-word tw:group-data-[variant=separator]/marker:flex-none tw:group-data-[variant=separator]/marker:text-center tw:*:[a]:underline tw:*:[a]:underline-offset-3 tw:*:[a]:hover:text-foreground',
        className
      )}
      {...props}
    />
  );
}

export { Marker, MarkerIcon, MarkerContent, markerVariants };
