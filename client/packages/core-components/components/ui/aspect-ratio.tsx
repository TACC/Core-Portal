import { cn } from 'cn';

function AspectRatio({
  ratio,
  className,
  ...props
}: React.ComponentProps<'div'> & { ratio: number }) {
  return (
    <div
      data-slot="aspect-ratio"
      style={
        {
          '--ratio': ratio,
        } as React.CSSProperties
      }
      className={cn('tw:relative tw:aspect-(--ratio)', className)}
      {...props}
    />
  );
}

export { AspectRatio };
