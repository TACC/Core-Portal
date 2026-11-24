import * as React from 'react';
import { cn } from 'cn';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible';
import { ChevronRightIcon } from 'lucide-react';

function Trace({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="trace"
      className={cn(
        'tw:flex tw:w-full tw:min-w-0 tw:flex-col tw:gap-2 tw:*:has-[>[data-slot=trace-line]]:flex tw:*:has-[>[data-slot=trace-line]]:w-fit tw:*:has-[>[data-slot=trace-line]]:max-w-full tw:*:has-[>[data-slot=trace-line]]:min-w-0 tw:*:has-[>[data-slot=trace-line]]:rounded-md tw:*:has-[>[data-slot=trace-line]]:text-left tw:*:has-[>[data-slot=trace-line]]:outline-none tw:*:has-[>[data-slot=trace-line]]:focus-visible:ring-3 tw:*:has-[>[data-slot=trace-line]]:focus-visible:ring-ring/50',
        className
      )}
      {...props}
    />
  );
}

function TraceLine({
  className,
  status,
  ...props
}: React.ComponentProps<'span'> & {
  status?: 'running' | 'error' | 'pending';
}) {
  return (
    <span
      data-slot="trace-line"
      data-status={status}
      className={cn(
        'tw:flex tw:w-fit tw:max-w-full tw:min-w-0 tw:items-center tw:gap-2 tw:text-sm tw:text-muted-foreground tw:transition-colors tw:in-[a,button]:cursor-pointer tw:in-[a:hover,button:hover]:text-foreground tw:data-[status=error]:text-destructive tw:data-[status=error]:in-[a:hover,button:hover]:text-destructive tw:data-[status=pending]:opacity-60 tw:data-[status=running]:*:data-[slot=trace-title]:shimmer',
        className
      )}
      {...props}
    />
  );
}

function TraceIcon({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="trace-icon"
      aria-hidden="true"
      className={cn(
        'tw:flex tw:size-4 tw:shrink-0 tw:items-center tw:justify-center tw:[&_svg]:pointer-events-none tw:[&_svg:not([class*=size-])]:size-4 tw:[[data-slot=trace-title]~&]:-ml-1',
        className
      )}
      {...props}
    />
  );
}

function TraceTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="trace-title"
      className={cn(
        'tw:min-w-0 tw:truncate tw:motion-reduce:shimmer-none',
        className
      )}
      {...props}
    />
  );
}

function TraceDescription({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="trace-description"
      className={cn(
        'tw:shrink-0 tw:text-muted-foreground/70 tw:tabular-nums',
        className
      )}
      {...props}
    />
  );
}

function TraceCollapsible({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Collapsible>, 'open'> &
  (
    | { open?: undefined }
    | {
        open: boolean;
        onOpenChange: NonNullable<
          React.ComponentProps<typeof Collapsible>['onOpenChange']
        >;
      }
  )) {
  return (
    <Collapsible
      data-slot="trace-collapsible"
      className={cn('tw:flex tw:w-full tw:min-w-0 tw:flex-col', className)}
      {...props}
    />
  );
}

function TraceCollapsibleTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsibleTrigger>) {
  return (
    <CollapsibleTrigger
      data-slot="trace-collapsible-trigger"
      className={cn(
        'tw:group/trace-collapsible-trigger tw:flex tw:w-fit tw:max-w-full tw:min-w-0 tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-md tw:text-left tw:text-muted-foreground tw:transition-colors tw:outline-none tw:hover:text-foreground tw:focus-visible:ring-3 tw:focus-visible:ring-ring/50 tw:has-[[data-status=error]]:text-destructive',
        className
      )}
      {...props}
    >
      {children}
      <TraceIcon className="tw:transition-transform tw:group-aria-expanded/trace-collapsible-trigger:rotate-90">
        <ChevronRightIcon />
      </TraceIcon>
    </CollapsibleTrigger>
  );
}

function TraceCollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent
      data-slot="trace-collapsible-content"
      className="tw:h-(--collapsible-panel-height) tw:min-w-0 tw:overflow-hidden tw:transition-[height] tw:duration-200 tw:data-ending-style:h-0 tw:data-starting-style:h-0"
      {...props}
    >
      <div
        data-slot="trace-collapsible-content-inner"
        className={cn(
          'tw:mt-2 tw:mb-1 tw:ml-[calc(--spacing(2)-1px)] tw:min-w-0 tw:border-l tw:pr-1 tw:pl-4 tw:leading-relaxed tw:wrap-break-word tw:text-muted-foreground',
          className
        )}
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

export {
  Trace,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
};
