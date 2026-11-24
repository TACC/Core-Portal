import * as React from 'react';
import { cn } from 'cn';

function MessageGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-group"
      className={cn('tw:flex tw:min-w-0 tw:flex-col tw:gap-2', className)}
      {...props}
    />
  );
}

function Message({
  className,
  align = 'start',
  ...props
}: React.ComponentProps<'div'> & { align?: 'start' | 'end' }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        'tw:group/message tw:relative tw:flex tw:w-full tw:min-w-0 tw:gap-2 tw:text-sm tw:data-[align=end]:flex-row-reverse',
        className
      )}
      {...props}
    />
  );
}

function MessageAvatar({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        'tw:flex tw:w-fit tw:min-w-8 tw:shrink-0 tw:items-center tw:justify-center tw:self-end tw:overflow-hidden tw:rounded-full tw:bg-muted tw:group-has-data-[slot=message-footer]/message:-translate-y-8',
        className
      )}
      {...props}
    />
  );
}

function MessageContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        'tw:flex tw:w-full tw:min-w-0 tw:flex-col tw:gap-2.5 tw:wrap-break-word tw:group-data-[align=end]/message:*:data-slot:self-end',
        className
      )}
      {...props}
    />
  );
}

function MessageHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        'tw:flex tw:max-w-full tw:min-w-0 tw:items-center tw:px-3 tw:text-xs tw:font-medium tw:text-muted-foreground tw:group-has-data-[variant=ghost]/message:px-0',
        className
      )}
      {...props}
    />
  );
}

function MessageFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        'tw:flex tw:max-w-full tw:min-w-0 tw:items-center tw:px-3 tw:text-xs tw:font-medium tw:text-muted-foreground tw:group-has-data-[variant=ghost]/message:px-0 tw:group-data-[align=end]/message:justify-end',
        className
      )}
      {...props}
    />
  );
}

export {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
};
