import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import { Alert, Button, FormGroup, Spinner } from 'reactstrap';
import { FormField } from '_common';
import * as Yup from 'yup';
import './RequestAccessForm.module.scss';

const formSchema = Yup.object().shape({
  problem_description: Yup.string().required('Required')
});

const defaultValues = {
  problem_description: ''
};

const RequestAccessForm = () => {
  const dispatch = useDispatch();
  const portalName = useSelector(state => state.workbench.portalName);
  const creating = useSelector(state => state.ticketCreate.creating);
  const creatingError = useSelector(state => state.ticketCreate.creatingError);
  const creatingErrorMessage = useSelector(
    state => state.ticketCreate.creatingErrorMessage
  );

  return (
    <Formik
      enableReinitialize
      initialValues={defaultValues}
      validationSchema={formSchema}
      onSubmit={(values, { resetForm }) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => formData.append(key, values[key]));
        formData.append('subject', `Feedback for ${portalName}`);
        dispatch({
          type: 'TICKET_CREATE',
          payload: {
            formData,
            resetSubmittedForm: resetForm,
            refreshTickets: true
          }
        });
      }}
    >
      {({ isSubmitting, dirty, isValid, submitCount }) => {
        return (
          <Form styleName="request-access-form">
            <FormGroup>
              <FormField
                name="userName"
                label="TACC Username"
                disabled={isSubmitting}
                required
              />
              <FormField
                name="password"
                label="TACC Password"
                type="password"
                required
                disabled={isSubmitting}
              />
              <FormField
                name="problem_description"
                label="Briefly describe your request including project and program name, PI name, institution/company, and your role"
                type="textarea"
                required
                styleName="request-access-text-area"
              />
            </FormGroup>
            <div styleName="request-access-button-row">
              {submitCount > 0 && creatingError && (
                <Alert color="warning">
                  Error submitting feedback: {creatingErrorMessage}
                </Alert>
              )}
              <Button
                type="submit"
                color="primary"
                styleName="button-primary"
                disabled={!dirty || !isValid || isSubmitting || creating}
              >
                {creating && (
                  <Spinner
                    size="sm"
                    color="white"
                    data-testid="creating-spinner"
                  />
                )}
                Request Access
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default RequestAccessForm;
