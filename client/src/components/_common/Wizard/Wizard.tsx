import React, { useState, useContext, useCallback, useEffect } from 'react';
import StepWizard, { StepWizardChildProps } from 'react-step-wizard';
import { Button } from '_common';
import { WizardStep } from '.';
import { Formik, Form, useFormikContext } from 'formik';
import styles from './Wizard.module.css';

export type WizardContextType = Partial<StepWizardChildProps>;

const WizardContext: React.Context<WizardContextType> =
  React.createContext<WizardContextType>({});

export const useWizard = () => {
  const props = useContext(WizardContext);
  return props;
};

export const WizardNavigation: React.FC = () => {
  const { currentStep, previousStep, totalSteps, nextStep } = useWizard();
  const { validateForm, handleSubmit } = useFormikContext();
  const onContinue = useCallback(async () => {
    try {
      const errors = await validateForm();
      if (!Object.keys(errors).length) {
        handleSubmit && handleSubmit();
        nextStep && nextStep();
      }
    } catch (e) {
      console.error(e);
    }
  }, [validateForm, nextStep, handleSubmit]);
  return (
    <div className={styles.controls}>
      {!!currentStep && currentStep > 1 && (
        <Button onClick={previousStep}>Back</Button>
      )}
      {!!currentStep && !!totalSteps && currentStep < totalSteps && (
        <Button attr="submit" type="primary" onClick={onContinue}>
          Continue
        </Button>
      )}
    </div>
  );
};

type StepContainerProps<T> = {
  step: WizardStep<T>;
  formSubmit: (values: Partial<T>) => void;
} & Partial<StepWizardChildProps>;

function StepContainer<T>({ step, formSubmit }: StepContainerProps<T>) {
  const { validationSchema, initialValues, validate } = step;
  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      validate={validate}
      onSubmit={formSubmit}
      enableReinitialize={true}
    >
      <Form>
        <div className={styles.step}>
          {step.render}
          <WizardNavigation />
        </div>
      </Form>
    </Formik>
  );
}

type WizardProps<T> = {
  steps: Array<WizardStep<T>>;
  memo?: any;
  formSubmit: (values: Partial<T>) => void;
};

function Wizard<T>({ steps, memo, formSubmit }: WizardProps<T>) {
  const [stepWizardProps, setStepWizardProps] = useState<
    Partial<StepWizardChildProps>
  >({});

  const instanceCallback = useCallback(
    (props: Partial<StepWizardChildProps>) => {
      setStepWizardProps({
        currentStep: 1,
        totalSteps: steps.length,
        ...props,
      });
    },
    [setStepWizardProps, steps]
  );

  const stepChangeCallback = useCallback(
    ({ activeStep }: { previousStep: number; activeStep: number }) => {
      setStepWizardProps({
        ...stepWizardProps,
        currentStep: activeStep,
      });
    },
    [setStepWizardProps, stepWizardProps]
  );

  const { goToStep } = stepWizardProps;

  useEffect(() => {
    goToStep && goToStep(1);
  }, [memo]);

  return (
    <WizardContext.Provider value={stepWizardProps}>
      <div className={styles.container}>
        <StepWizard
          instance={instanceCallback}
          className={styles.steps}
          onStepChange={stepChangeCallback}
          transitions={{}}
        >
          {steps.map((step) => (
            <StepContainer<T>
              step={step}
              key={`wizard-step-${step.id}`}
              stepName={step.id}
              formSubmit={formSubmit}
            />
          ))}
        </StepWizard>
      </div>
    </WizardContext.Provider>
  );
}

export default Wizard;
