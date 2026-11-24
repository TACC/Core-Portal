'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

import { Button } from '#/components/ui/button';
import { CheckIcon, CopyIcon } from 'lucide-react';

const codeBlockVariants = cva(
  'tw:group/code-block tw:relative tw:flex tw:w-full tw:min-w-0 tw:flex-col tw:overflow-hidden tw:rounded-lg tw:text-sm tw:has-[>[data-slot=code-block-content]:focus-visible]:ring-3 tw:has-[>[data-slot=code-block-content]:focus-visible]:ring-ring/50 tw:data-[size=sm]:text-xs',
  {
    variants: {
      variant: {
        default:
          'tw:border tw:border-input tw:text-foreground tw:has-[>[data-slot=code-block-content]:focus-visible]:border-ring tw:dark:bg-input/30',
        destructive:
          'tw:border tw:border-destructive/30 tw:text-destructive tw:dark:border-destructive/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function CodeBlock({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof codeBlockVariants> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot="code-block"
      data-variant={variant}
      data-size={size}
      className={cn(codeBlockVariants({ variant }), className)}
      {...props}
    />
  );
}

function CodeBlockHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="code-block-header"
      className={cn(
        'tw:flex tw:min-w-0 tw:shrink-0 tw:items-center tw:gap-2 tw:px-3 tw:pt-3 tw:text-muted-foreground tw:group-data-[size=sm]/code-block:px-2.5 tw:group-data-[size=sm]/code-block:pt-2.5 tw:group-data-[variant=destructive]/code-block:text-destructive tw:*:has-[>[data-slot=code-block-title]]:min-w-0',
        className
      )}
      {...props}
    />
  );
}

function CodeBlockTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="code-block-title"
      className={cn(
        'tw:min-w-0 tw:truncate tw:font-sans tw:text-sm tw:font-medium tw:text-foreground tw:group-data-[size=sm]/code-block:text-xs tw:group-data-[variant=destructive]/code-block:text-destructive tw:[&_svg]:pointer-events-none tw:[&_svg]:inline-block tw:[&_svg]:align-middle tw:[&_svg:not([class*=size-])]:size-3.5 tw:*:[svg]:me-1.5',
        className
      )}
      {...props}
    />
  );
}

function CodeBlockActions({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="code-block-actions"
      className={cn(
        'tw:-my-1 tw:ms-auto tw:-me-1.5 tw:flex tw:shrink-0 tw:items-center tw:gap-1 tw:[[data-slot=code-block]>&]:absolute tw:[[data-slot=code-block]>&]:end-2 tw:[[data-slot=code-block]>&]:top-2 tw:[[data-slot=code-block]>&]:z-10 tw:[[data-slot=code-block]>&]:m-0 tw:[[data-slot=code-block]>&]:opacity-0 tw:[[data-slot=code-block]>&]:transition-opacity tw:[[data-slot=code-block]>&]:group-focus-within/code-block:opacity-100 tw:[[data-slot=code-block]>&]:group-hover/code-block:opacity-100 tw:group-data-[size=sm]/code-block:[[data-slot=code-block]>&]:end-1.5 tw:group-data-[size=sm]/code-block:[[data-slot=code-block]>&]:top-1.5 tw:[[data-slot=code-block]>&]:pointer-coarse:opacity-100 tw:[[data-slot=code-block]>&]:*:[button]:bg-background tw:[[data-slot=code-block]>&]:*:[button]:ring-1 tw:[[data-slot=code-block]>&]:*:[button]:ring-foreground/10',
        className
      )}
      {...props}
    />
  );
}

function CodeBlockCopyButton({
  value,
  variant = 'ghost',
  size = 'icon-xs',
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { value: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <>
      <Button
        data-slot="code-block-copy-button"
        data-copied={copied || undefined}
        variant={variant}
        size={size}
        aria-label={copied ? 'Copied' : 'Copy'}
        className={cn(className)}
        onClick={(event) => {
          onClick?.(event);
          navigator.clipboard
            .writeText(value)
            .then(() => setCopied(true))
            .catch(() => {});
        }}
        {...props}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <span aria-live="polite" className="tw:sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </>
  );
}

function CodeBlockContent({
  className,
  children,
  style,
  wrap = false,
  lineNumbers = false,
  startLine = 1,
  ...props
}: React.ComponentProps<'pre'> & {
  wrap?: boolean;
  lineNumbers?: boolean;
  startLine?: number;
}) {
  return (
    <pre
      data-slot="code-block-content"
      data-wrap={wrap || undefined}
      data-numbered={lineNumbers || undefined}
      dir="ltr"
      tabIndex={0}
      style={{ counterReset: `line ${startLine - 1}`, ...style }}
      className={cn(
        'tw:min-h-0 tw:min-w-0 tw:scroll-fade-x tw:scrollbar-thin tw:overflow-auto tw:px-3 tw:py-3 tw:text-start tw:font-mono tw:leading-relaxed tw:outline-none tw:group-has-data-[slot=code-block-footer]/code-block:pb-2 tw:group-has-data-[slot=code-block-header]/code-block:pt-2 tw:group-data-[size=sm]/code-block:px-2.5 tw:group-data-[size=sm]/code-block:py-2.5 tw:group-data-[size=sm]/code-block:group-has-data-[slot=code-block-header]/code-block:pt-1.5 tw:data-wrap:scroll-fade-y tw:data-wrap:wrap-break-word tw:data-wrap:whitespace-pre-wrap',
        className
      )}
      {...props}
    >
      <code
        data-slot="code-block-code"
        className="tw:grid tw:min-h-lh tw:min-w-max tw:content-start tw:in-data-numbered:grid-cols-[auto_1fr] tw:in-data-wrap:min-w-0"
      >
        {lineNumbers && typeof children === 'string'
          ? children
              .replace(/\n$/, '')
              .split('\n')
              .map((line, index) => (
                <CodeBlockLine key={index}>{line}</CodeBlockLine>
              ))
          : children}
      </code>
    </pre>
  );
}

const codeBlockLineVariants = cva(
  'tw:relative tw:-mx-3 tw:block tw:min-h-lh tw:px-3 tw:group-data-[size=sm]/code-block:-mx-2.5 tw:group-data-[size=sm]/code-block:px-2.5 tw:before:min-w-6 tw:before:text-end tw:before:text-muted-foreground tw:after:absolute tw:after:start-1 tw:after:top-0 tw:after:text-muted-foreground tw:after:select-none tw:in-data-numbered:col-span-2 tw:in-data-numbered:grid tw:in-data-numbered:grid-cols-subgrid tw:in-data-numbered:gap-x-3 tw:in-data-numbered:[counter-increment:line] tw:in-data-numbered:before:content-[counter(line)] tw:in-data-numbered:before:select-none tw:in-data-numbered:supports-[content:counter(line)_/_]:before:content-[counter(line)_/_]',
  {
    variants: {
      variant: {
        default: 'tw:',
        added: 'tw:bg-muted tw:after:content-[+]',
        removed:
          'tw:bg-destructive/10 tw:after:text-destructive tw:after:content-[−]',
        highlighted: 'tw:bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function CodeBlockLine({
  className,
  variant = 'default',
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof codeBlockLineVariants>) {
  // An empty line holds a newline so copying a selection keeps blank lines.
  const empty =
    children === undefined ||
    children === null ||
    children === '' ||
    (Array.isArray(children) && children.length === 0);

  return (
    <span
      data-slot="code-block-line"
      data-variant={variant}
      className={cn(codeBlockLineVariants({ variant }), className)}
      {...props}
    >
      <span data-slot="code-block-line-content" className="tw:min-w-0">
        {empty ? '\n' : children}
      </span>
    </span>
  );
}

function CodeBlockFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="code-block-footer"
      className={cn(
        'tw:flex tw:min-w-0 tw:shrink-0 tw:items-center tw:gap-2 tw:px-3 tw:pb-3 tw:text-muted-foreground tw:group-data-[size=sm]/code-block:px-2.5 tw:group-data-[size=sm]/code-block:pb-2.5',
        className
      )}
      {...props}
    />
  );
}

export {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockContent,
  CodeBlockLine,
  CodeBlockFooter,
};
