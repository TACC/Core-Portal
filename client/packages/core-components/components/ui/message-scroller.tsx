import * as React from 'react';
import {
  MessageScroller as MessageScrollerPrimitive,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from '@shadcn/react/message-scroller';
import { cn } from 'cn';

import { Button } from '#/components/ui/button';
import { ArrowDownIcon } from 'lucide-react';

function MessageScrollerProvider(
  props: React.ComponentProps<typeof MessageScrollerPrimitive.Provider>
) {
  return <MessageScrollerPrimitive.Provider {...props} />;
}

function MessageScroller({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Root>) {
  return (
    <MessageScrollerPrimitive.Root
      data-slot="message-scroller"
      className={cn(
        'tw:group/message-scroller tw:relative tw:flex tw:size-full tw:min-h-0 tw:flex-col tw:overflow-hidden',
        className
      )}
      {...props}
    />
  );
}

function MessageScrollerViewport({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        'tw:size-full tw:min-h-0 tw:min-w-0 tw:scroll-fade-b tw:scrollbar-thin tw:scrollbar-gutter-stable tw:overflow-y-auto tw:overscroll-contain tw:contain-content tw:data-autoscrolling:scrollbar-thumb-transparent tw:data-autoscrolling:scrollbar-track-transparent tw:data-pending-scroll:invisible',
        className
      )}
      {...props}
    />
  );
}

function MessageScrollerContent({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Content>) {
  return (
    <MessageScrollerPrimitive.Content
      data-slot="message-scroller-content"
      className={cn(
        'tw:flex tw:h-max tw:min-h-full tw:flex-col tw:gap-6',
        className
      )}
      {...props}
    />
  );
}

function MessageScrollerItem({
  className,
  scrollAnchor = false,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Item>) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      scrollAnchor={scrollAnchor}
      className={cn(
        'tw:min-w-0 tw:shrink-0 tw:[contain-intrinsic-size:auto_10rem] tw:[content-visibility:auto]',
        className
      )}
      {...props}
    />
  );
}

function MessageScrollerButton({
  direction = 'end',
  className,
  children,
  render,
  variant = 'secondary',
  size = 'icon-sm',
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Button> &
  Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <MessageScrollerPrimitive.Button
      data-slot="message-scroller-button"
      data-direction={direction}
      data-variant={variant}
      data-size={size}
      direction={direction}
      className={cn(
        'tw:absolute tw:inset-s-1/2 tw:-translate-x-1/2 tw:border-border tw:bg-background tw:text-foreground tw:transition-[translate,scale,opacity] tw:duration-200 tw:hover:bg-muted tw:hover:text-foreground tw:data-[active=false]:pointer-events-none tw:data-[active=false]:scale-95 tw:data-[active=false]:opacity-0 tw:data-[active=false]:duration-400 tw:data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)] tw:data-[active=true]:translate-y-0 tw:data-[active=true]:scale-100 tw:data-[active=true]:opacity-100 tw:data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] tw:data-[direction=end]:bottom-4 tw:data-[direction=end]:data-[active=false]:translate-y-full tw:data-[direction=start]:top-4 tw:data-[direction=start]:data-[active=false]:-translate-y-full tw:rtl:translate-x-1/2 tw:data-[direction=start]:[&_svg]:rotate-180',
        className
      )}
      render={render ?? <Button variant={variant} size={size} />}
      {...props}
    >
      {children ?? (
        <>
          <ArrowDownIcon />
          <span className="tw:sr-only">
            {direction === 'end' ? 'Scroll to end' : 'Scroll to start'}
          </span>
        </>
      )}
    </MessageScrollerPrimitive.Button>
  );
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
};
