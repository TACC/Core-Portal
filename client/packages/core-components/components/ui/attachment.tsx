import * as React from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

import { Button } from '#/components/ui/button';

const attachmentVariants = cva(
  'tw:group/attachment tw:relative tw:flex tw:w-fit tw:max-w-full tw:min-w-0 tw:shrink-0 tw:flex-wrap tw:rounded-xl tw:border tw:bg-card tw:text-card-foreground tw:transition-colors tw:focus-within:ring-1 tw:focus-within:ring-ring/50 tw:has-[>a,>button]:hover:bg-muted/50 tw:data-[state=error]:border-destructive/30 tw:data-[state=idle]:border-dashed',
  {
    variants: {
      size: {
        default:
          'tw:gap-2 tw:text-sm tw:has-data-[slot=attachment-content]:px-2.5 tw:has-data-[slot=attachment-content]:py-2 tw:has-data-[slot=attachment-media]:p-2',
        sm: 'tw:gap-2.5 tw:text-xs tw:has-data-[slot=attachment-content]:px-2 tw:has-data-[slot=attachment-content]:py-1.5 tw:has-data-[slot=attachment-media]:p-1.5',
        xs: 'tw:gap-1.5 tw:rounded-lg tw:text-xs tw:has-data-[slot=attachment-content]:px-1.5 tw:has-data-[slot=attachment-content]:py-1 tw:has-data-[slot=attachment-media]:p-1',
      },
      orientation: {
        horizontal: 'tw:min-w-40 tw:items-center',
        vertical:
          'tw:w-24 tw:flex-col tw:has-data-[slot=attachment-content]:w-30',
      },
    },
  }
);

function Attachment({
  className,
  state = 'done',
  size = 'default',
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof attachmentVariants> & {
    state?: 'idle' | 'uploading' | 'processing' | 'error' | 'done';
  }) {
  return (
    <div
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      className={cn(attachmentVariants({ size, orientation }), className)}
      {...props}
    />
  );
}

const attachmentMediaVariants = cva(
  'tw:relative tw:flex tw:aspect-square tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:bg-muted tw:text-foreground tw:group-data-[orientation=vertical]/attachment:w-full tw:group-data-[size=sm]/attachment:w-8 tw:group-data-[size=xs]/attachment:w-7 tw:group-data-[size=xs]/attachment:rounded-md tw:group-data-[state=error]/attachment:bg-destructive/10 tw:group-data-[state=error]/attachment:text-destructive tw:group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! tw:[&_svg]:pointer-events-none tw:[&_svg:not([class*=size-])]:size-4 tw:group-data-[orientation=vertical]/attachment:[&_svg:not([class*=size-])]:size-6 tw:group-data-[size=xs]/attachment:[&_svg:not([class*=size-])]:size-3.5',
  {
    variants: {
      variant: {
        icon: 'tw:',
        image:
          'tw:opacity-60 tw:group-data-[state=done]/attachment:opacity-100 tw:group-data-[state=idle]/attachment:opacity-100 tw:*:[img]:aspect-square tw:*:[img]:w-full tw:*:[img]:object-cover',
      },
    },
    defaultVariants: {
      variant: 'icon',
    },
  }
);

function AttachmentMedia({
  className,
  variant = 'icon',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof attachmentMediaVariants>) {
  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(attachmentMediaVariants({ variant }), className)}
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
      className={cn(
        'tw:max-w-full tw:min-w-0 tw:flex-1 tw:leading-tight tw:group-data-[orientation=vertical]/attachment:px-1',
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
      className={cn(
        'tw:block tw:max-w-full tw:min-w-0 tw:truncate tw:font-medium tw:group-data-[state=processing]/attachment:shimmer tw:group-data-[state=uploading]/attachment:shimmer',
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
      className={cn(
        'tw:mt-0.5 tw:block tw:min-w-0 tw:truncate tw:text-xs tw:text-muted-foreground tw:group-data-[state=error]/attachment:text-destructive/80',
        'tw:max-w-full',
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
      className={cn(
        'tw:relative tw:z-20 tw:flex tw:shrink-0 tw:items-center tw:group-data-[orientation=vertical]/attachment:absolute tw:group-data-[orientation=vertical]/attachment:top-3 tw:group-data-[orientation=vertical]/attachment:right-3 tw:group-data-[orientation=vertical]/attachment:gap-1',
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
      className={cn(className)}
      {...props}
    />
  );
}

function AttachmentTrigger({
  className,
  render,
  type,
  ...props
}: useRender.ComponentProps<'button'>) {
  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        type: render ? type : (type ?? 'button'),
        className: cn('absolute inset-0 z-10 outline-none', className),
      },
      props
    ),
    render,
    state: {
      slot: 'attachment-trigger',
    },
  });
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        'tw:flex tw:min-w-0 tw:scroll-fade-x tw:snap-x tw:snap-mandatory tw:scroll-px-1 tw:scrollbar-none tw:gap-3 tw:overflow-x-auto tw:overscroll-x-contain tw:py-1 tw:*:data-[slot=attachment]:flex-none tw:*:data-[slot=attachment]:snap-start',
        className
      )}
      {...props}
    />
  );
}

export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
};
