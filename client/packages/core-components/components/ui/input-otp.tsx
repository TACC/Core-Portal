import * as React from 'react';
import { cn } from 'cn';
import { OTPInput, OTPInputContext } from 'input-otp';
import { MinusIcon } from 'lucide-react';

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        'cn-input-otp flex items-center has-disabled:opacity-50',
        containerClassName
      )}
      spellCheck={false}
      className={cn('tw:disabled:cursor-not-allowed', className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        'tw:flex tw:items-center tw:rounded-lg tw:has-aria-invalid:border-destructive tw:has-aria-invalid:ring-3 tw:has-aria-invalid:ring-destructive/20 tw:dark:has-aria-invalid:ring-destructive/40',
        className
      )}
      {...props}
    />
  );
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        'tw:relative tw:flex tw:size-8 tw:items-center tw:justify-center tw:border-y tw:border-r tw:border-input tw:text-sm tw:transition-all tw:outline-none tw:first:rounded-l-lg tw:first:border-l tw:last:rounded-r-lg tw:aria-invalid:border-destructive tw:data-[active=true]:z-10 tw:data-[active=true]:border-ring tw:data-[active=true]:ring-3 tw:data-[active=true]:ring-ring/50 tw:data-[active=true]:aria-invalid:border-destructive tw:data-[active=true]:aria-invalid:ring-destructive/20 tw:dark:bg-input/30 tw:dark:data-[active=true]:aria-invalid:ring-destructive/40',
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="tw:pointer-events-none tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center">
          <div className="tw:h-4 tw:w-px tw:animate-caret-blink tw:bg-foreground tw:duration-1000" />
        </div>
      )}
    </div>
  );
}

function InputOTPSeparator({ ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-separator"
      className="tw:flex tw:items-center tw:[&_svg:not([class*=size-])]:size-4"
      role="separator"
      {...props}
    >
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
