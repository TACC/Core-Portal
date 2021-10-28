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
  username: '',
  password: '',
  problem_description: ''
};

const RequestAccessForm = () => {
  const dispatch = useDispatch();
  const portalName = useSelector(state => state.workbench.portalName);
  const creating = useSelector(state => state.requestAccess.creating);
  const creatingError = useSelector(state => state.requestAccess.creatingError);
  const creatingSuccess = useSelector(
    state => state.requestAccess.creatingSuccess
  );
  const ticketId = useSelector(state => state.requestAccess.createdTicketId);
  const creatingErrorMessage = useSelector(
    state => state.requestAccess.creatingErrorMessage
  );

  return (
    <Formik
      enableReinitialize
      initialValues={defaultValues}
      validationSchema={formSchema}
      onSubmit={(values, { resetForm }) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => formData.append(key, values[key]));
        formData.append('subject', `Access request for ${portalName}`);
        dispatch({
          type: 'REQUEST_ACCESS',
          payload: {
            formData,
            resetSubmittedForm: resetForm
          }
        });
      }}
    >
      {({ isSubmitting, dirty, isValid, submitCount }) => {
        return (
          <Form styleName="request-access-form">
            <FormGroup>
              <FormField
                name="username"
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
              {creatingSuccess && (
                <Alert color="success" className="ticket-creation-info-alert">
                  Ticket (#{ticketId}) was created. Support staff will contact
                  you via email regarding your Access Request.
                </Alert>
              )}
              {submitCount > 0 && creatingError && (
                <Alert color="warning">
                  Error requesting access: {creatingErrorMessage}
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
