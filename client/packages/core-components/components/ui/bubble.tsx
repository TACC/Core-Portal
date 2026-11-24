import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

function BubbleGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="bubble-group"
      className={cn('tw:flex tw:min-w-0 tw:flex-col tw:gap-2', className)}
      {...props}
    />
  );
}

const bubbleVariants = cva(
  'tw:group/bubble tw:relative tw:flex tw:w-fit tw:max-w-[80%] tw:min-w-0 tw:flex-col tw:gap-1 tw:group-data-[align=end]/message:self-end tw:data-[align=end]:self-end tw:data-[variant=ghost]:max-w-full',
  {
    variants: {
      variant: {
        default:
          'tw:*:data-[slot=bubble-content]:bg-primary tw:*:data-[slot=bubble-content]:text-primary-foreground tw:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80',
        secondary:
          'tw:*:data-[slot=bubble-content]:bg-secondary tw:*:data-[slot=bubble-content]:text-secondary-foreground tw:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
        muted:
          'tw:*:data-[slot=bubble-content]:bg-muted tw:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]',
        tinted:
          'tw:*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)] tw:*:data-[slot=bubble-content]:text-foreground tw:dark:*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.3_calc(c*0.4)_h)] tw:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.88_calc(c*0.5)_h)] tw:dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.35_calc(c*0.5)_h)]',
        outline:
          'tw:*:data-[slot=bubble-content]:border-border tw:*:data-[slot=bubble-content]:bg-background tw:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted tw:[&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground tw:dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-input/30',
        ghost:
          'tw:border-none tw:*:data-[slot=bubble-content]:rounded-none tw:*:data-[slot=bubble-content]:bg-transparent tw:*:data-[slot=bubble-content]:p-0 tw:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted tw:[&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground tw:dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/50',
        destructive:
          'tw:*:data-[slot=bubble-content]:bg-destructive/10 tw:*:data-[slot=bubble-content]:text-destructive tw:dark:*:data-[slot=bubble-content]:bg-destructive/20 tw:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20 tw:dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Bubble({
  variant = 'default',
  align = 'start',
  className,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof bubbleVariants> & {
    align?: 'start' | 'end';
  }) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  );
}

function BubbleContent({
  className,
  render,
  ...props
}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/50',
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: 'bubble-content',
    },
  });
}

const bubbleReactionsVariants = cva(
  'tw:absolute tw:z-10 tw:flex tw:w-fit tw:shrink-0 tw:items-center tw:justify-center tw:gap-1 tw:rounded-full tw:bg-muted tw:px-1.5 tw:py-0.5 tw:text-sm tw:ring-3 tw:ring-card tw:has-[button]:p-0',
  {
    variants: {
      side: {
        top: 'tw:top-0 tw:-translate-y-3/4',
        bottom: 'tw:bottom-0 tw:translate-y-3/4',
      },
      align: {
        start: 'tw:left-3',
        end: 'tw:right-3',
      },
    },
    defaultVariants: {
      side: 'bottom',
      align: 'end',
    },
  }
);

function BubbleReactions({
  side = 'bottom',
  align = 'end',
  className,
  ...props
}: React.ComponentProps<'div'> & {
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
}) {
  return (
    <div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  );
}

export { BubbleGroup, Bubble, BubbleContent, BubbleReactions };
