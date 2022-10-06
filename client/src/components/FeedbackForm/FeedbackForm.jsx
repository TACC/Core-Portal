import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import { Alert, FormGroup } from 'reactstrap';
import { Button, FormField } from '_common';
import * as Yup from 'yup';
import styles from './FeedbackForm.module.scss';

const formSchema = Yup.object().shape({
  problem_description: Yup.string().required('Required'),
});

const defaultValues = {
  problem_description: '',
};

const FeedbackForm = () => {
  const dispatch = useDispatch();
  const portalName = useSelector((state) => state.workbench.portalName);
  const creating = useSelector((state) => state.ticketCreate.creating);
  const creatingError = useSelector(
    (state) => state.ticketCreate.creatingError
  );
  const creatingErrorMessage = useSelector(
    (state) => state.ticketCreate.creatingErrorMessage
  );

  return (
    <Formik
      enableReinitialize
      initialValues={defaultValues}
      validationSchema={formSchema}
      onSubmit={(values, { resetForm }) => {
        const formData = new FormData();
        Object.keys(values).forEach((key) => formData.append(key, values[key]));
        formData.append('subject', `Feedback for ${portalName}`);
        dispatch({
          type: 'TICKET_CREATE',
          payload: {
            formData,
            resetSubmittedForm: resetForm,
            refreshTickets: true,
          },
        });
      }}
    >
      {({ isSubmitting, dirty, isValid, submitCount }) => {
        return (
          <Form className={styles.container}>
            <FormGroup>
              <FormField
                name="problem_description"
                label="Feedback"
                type="textarea"
                className={styles['comments-textarea']}
                required
              />
            </FormGroup>
            <div className="ticket-create-button-row">
              {creating && (
                  <Alert color="success" className="ticket-create-info-alert">
                    "Message successfully sent. Thank you for your feedback!"
                  </Alert>
              )}
              {submitCount > 0 && creatingError && (
                <Alert color="warning">
                  Error submitting feedback: {creatingErrorMessage}
                </Alert>
              )}
              <Button
                attr="submit"
                type="primary"
                size="medium"
                disabled={!dirty || !isValid || isSubmitting || creating}
                isLoading={creating}
              >
                Submit
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default FeedbackForm;
