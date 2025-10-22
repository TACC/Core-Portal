import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import { Alert, Button, FormGroup, Spinner } from 'reactstrap';
import { FormField } from '_common';
import * as Yup from 'yup';
import styles from './RequestAccessForm.module.css';

const formSchema = Yup.object().shape({
  username: Yup.string().required('Required'),
  password: Yup.string().required('Required'),
  problem_description: Yup.string().required('Required'),
});

const defaultValues = {
  username: '',
  password: '',
  problem_description: '',
};

const RequestAccessForm = () => {
  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);
  const loading = useSelector((state) => state.requestAccess.loading);
  const ticketId = useSelector((state) => state.requestAccess.createdTicketId);
  const error = useSelector((state) => state.requestAccess.error);

  return (
    <Formik
      validateOnMount
      enableReinitialize
      initialValues={defaultValues}
      validationSchema={formSchema}
      onSubmit={(values, { setSubmitting, resetForm }) => {
        const formData = new FormData();
        Object.keys(values).forEach((key) => formData.append(key, values[key]));
        formData.append('subject', `Access request for ${portalName}`);
        dispatch({
          type: 'REQUEST_ACCESS',
          payload: {
            formData,
            resetSubmittedForm: resetForm,
          },
        });
        setSubmitting(false);
      }}
    >
      {({ isSubmitting, isValid, submitCount }) => {
        return (
          <Form className={styles['request-access-form']}>
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
                label="Description of Work"
                type="textarea"
                required
                className={styles['request-access-text-area']}
              />
              <small className={styles['help']}>
                Briefly describe your request including project and program
                name, PI name, institution/company, and your role.
              </small>
            </FormGroup>
            <div className={styles['request-access-button-row']}>
              {submitCount === 0 && ticketId && (
                <Alert color="success" className="ticket-creation-info-alert">
                  Ticket (#{ticketId}) was created. Support staff will contact
                  you via email regarding your Access Request.
                </Alert>
              )}
              {submitCount > 0 && error && (
                <Alert color="warning">Error requesting access: {error}</Alert>
              )}
              <Button
                color="link"
                className={styles['button']}
                href="/tickets/new/"
              >
                Get Help
              </Button>
              <Button
                type="submit"
                color="primary"
                className={styles['button-primary']}
                disabled={!isValid || isSubmitting || loading}
              >
                {loading && (
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
