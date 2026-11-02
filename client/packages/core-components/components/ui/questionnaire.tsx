'use client';

import * as React from 'react';
import { Questionnaire as QuestionnairePrimitive } from '@shadcn/react/questionnaire';
import { cn } from 'cn';

import { buttonVariants, type Button } from '#/components/ui/button';
import { CheckIcon } from 'lucide-react';

function Questionnaire({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root
      data-slot="questionnaire"
      className={cn(
        'tw:flex tw:w-full tw:min-w-0 tw:flex-col tw:gap-4',
        className
      )}
      {...props}
    />
  );
}

function QuestionnaireProgress({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  return (
    <QuestionnairePrimitive.Progress
      data-slot="questionnaire-progress"
      className={cn(
        'tw:min-h-[1lh] tw:w-fit tw:min-w-[14ch] tw:text-xs tw:font-medium tw:text-muted-foreground tw:tabular-nums',
        className
      )}
      {...props}
    />
  );
}

function QuestionnaireItem({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      data-slot="questionnaire-item"
      className={cn(
        'tw:flex tw:min-w-0 tw:flex-col tw:gap-4 tw:border-0 tw:p-0 tw:outline-none',
        className
      )}
      {...props}
    />
  );
}

function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn(
        'tw:font-heading tw:text-base tw:leading-snug tw:font-medium tw:text-pretty tw:[&:not(:has(~[data-slot=questionnaire-description]))]:mb-4',
        className
      )}
      {...props}
    />
  );
}

function QuestionnaireDescription({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      data-slot="questionnaire-description"
      className={cn(
        'tw:text-sm tw:text-pretty tw:text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn(
        'tw:group/questionnaire-choices tw:grid tw:min-w-0 tw:gap-2',
        className
      )}
      {...props}
    />
  );
}

function QuestionnaireChoice({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      className={cn(
        'tw:group/questionnaire-choice tw:relative tw:flex tw:min-h-11 tw:cursor-pointer tw:items-start tw:gap-2.5 tw:rounded-lg tw:border tw:border-input tw:bg-transparent tw:px-3 tw:py-2.5 tw:text-start tw:text-sm tw:transition-colors tw:outline-none tw:select-none tw:hover:bg-muted/50 tw:has-[>input:focus-visible]:border-ring tw:has-[>input:focus-visible]:ring-3 tw:has-[>input:focus-visible]:ring-ring/50 tw:data-invalid:border-destructive tw:dark:bg-input/20 tw:data-checked:border-primary/40 tw:data-checked:bg-muted tw:dark:data-checked:bg-muted',
        'tw:data-disabled:pointer-events-none tw:data-disabled:cursor-not-allowed tw:data-disabled:opacity-50',
        className
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        data-slot="questionnaire-choice-input"
        className="tw:absolute tw:inset-0 tw:z-10 tw:size-full tw:cursor-pointer tw:opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        className="tw:pointer-events-none tw:relative tw:flex tw:size-4 tw:shrink-0 tw:translate-y-[--spacing(0.45)] tw:items-center tw:justify-center tw:rounded-[4px] tw:border tw:border-input tw:group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 tw:group-data-[type=radio]/questionnaire-choice:rounded-full tw:group-data-checked/questionnaire-choice:border-primary tw:group-data-checked/questionnaire-choice:bg-primary tw:group-data-checked/questionnaire-choice:text-primary-foreground tw:dark:bg-input/30 tw:dark:group-data-checked/questionnaire-choice:bg-primary"
      >
        <span
          data-slot="questionnaire-choice-indicator-dot"
          className="tw:hidden tw:size-2 tw:rounded-full tw:bg-primary-foreground tw:group-data-[type=checkbox]/questionnaire-choice:hidden tw:group-data-checked/questionnaire-choice:block"
        />
        <CheckIcon
          data-slot="questionnaire-choice-indicator-check"
          className="tw:hidden tw:size-3.5 tw:group-data-[type=radio]/questionnaire-choice:hidden tw:group-data-checked/questionnaire-choice:block"
        />
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        data-slot="questionnaire-choice-label"
        className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5 tw:leading-snug"
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        data-slot="questionnaire-choice-shortcut"
        className="tw:pointer-events-none tw:ms-auto tw:hidden tw:size-5 tw:shrink-0 tw:translate-y-[--spacing(0.45)] tw:items-center tw:justify-center tw:rounded-md tw:border tw:border-input tw:bg-background tw:font-mono tw:text-[0.625rem] tw:leading-none tw:font-medium tw:text-muted-foreground tw:group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 tw:group-data-[shortcut]/questionnaire-choice:inline-flex"
      />
    </QuestionnairePrimitive.Choice>
  );
}

function QuestionnaireChoiceDescription({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="questionnaire-choice-description"
      className={cn('tw:text-muted-foreground', className)}
      {...props}
    />
  );
}

function QuestionnaireInput({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Input>) {
  return (
    <div
      data-slot="questionnaire-input-wrapper"
      className="tw:group/questionnaire-input tw:relative tw:w-full tw:min-w-0"
    >
      <QuestionnairePrimitive.Input
        data-slot="questionnaire-input"
        className={cn(
          'tw:h-8 tw:min-h-11 tw:w-full tw:min-w-0 tw:rounded-lg tw:border tw:border-input tw:bg-transparent tw:px-2.5 tw:py-1 tw:text-base tw:transition-[color,box-shadow,background-color] tw:outline-none tw:focus-visible:border-ring tw:focus-visible:ring-3 tw:focus-visible:ring-ring/50 tw:disabled:pointer-events-none tw:disabled:cursor-not-allowed tw:disabled:bg-input/50 tw:disabled:opacity-50 tw:aria-invalid:border-destructive tw:aria-invalid:ring-3 tw:aria-invalid:ring-destructive/20 tw:sm:min-h-0 tw:md:text-sm tw:dark:bg-input/30 tw:dark:disabled:bg-input/80 tw:dark:aria-invalid:border-destructive/50 tw:dark:aria-invalid:ring-destructive/40',
          'tw:selection:bg-primary tw:selection:text-primary-foreground tw:placeholder:text-muted-foreground',
          className
        )}
        {...props}
      />
    </div>
  );
}

function QuestionnaireError({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      data-slot="questionnaire-error"
      className={cn('tw:mt-2 tw:text-sm tw:text-destructive', className)}
      {...props}
    />
  );
}

function QuestionnaireActions({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn(
        'tw:grid tw:min-h-11 tw:w-full tw:grid-cols-[minmax(0,1fr)_auto_auto] tw:items-center tw:gap-2 tw:sm:min-h-8',
        className
      )}
      {...props}
    />
  );
}

function QuestionnairePrevious({
  children,
  className,
  size = 'default',
  variant = 'outline',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> &
  Pick<React.ComponentProps<typeof Button>, 'size' | 'variant'>) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        'tw:col-start-1 tw:row-start-1 tw:min-h-11 tw:justify-self-start tw:sm:min-h-0',
        className
      )}
      {...props}
    >
      {children ?? 'Previous'}
    </QuestionnairePrimitive.Previous>
  );
}

function QuestionnaireSkip({
  children,
  className,
  size = 'default',
  variant = 'outline',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> &
  Pick<React.ComponentProps<typeof Button>, 'size' | 'variant'>) {
  return (
    <QuestionnairePrimitive.Skip
      data-slot="questionnaire-skip"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        'tw:col-start-2 tw:row-start-1 tw:min-h-11 tw:justify-self-end tw:sm:min-h-0',
        className
      )}
      {...props}
    >
      {children ?? 'Skip'}
    </QuestionnairePrimitive.Skip>
  );
}

function QuestionnaireNext({
  children,
  className,
  size = 'default',
  variant = 'default',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> &
  Pick<React.ComponentProps<typeof Button>, 'size' | 'variant'>) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        'tw:col-start-3 tw:row-start-1 tw:min-h-11 tw:justify-self-end tw:sm:min-h-0',
        className
      )}
      {...props}
    >
      {children ?? 'Next'}
    </QuestionnairePrimitive.Next>
  );
}

function QuestionnaireSubmit({
  children,
  className,
  size = 'default',
  variant = 'default',
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> &
  Pick<React.ComponentProps<typeof Button>, 'size' | 'variant'>) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        'tw:col-start-3 tw:row-start-1 tw:min-h-11 tw:justify-self-end tw:sm:min-h-0',
        className
      )}
      {...props}
    >
      {children ?? 'Submit'}
    </QuestionnairePrimitive.Submit>
  );
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
};
