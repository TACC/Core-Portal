import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Formik, Form } from 'formik';
import { Alert, Button, FormGroup, Spinner } from 'reactstrap';
import { FormField } from '_common';
import * as Yup from 'yup';
import './FeedbackForm.module.scss';

const formSchema = Yup.object().shape({
  subject: Yup.string().required('Required'),
  name: Yup.string().required('Required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Required'),
  problem_description: Yup.string().required('Required')
});

const FeedbackForm = ({ authenticatedUser }) => {
  const dispatch = useDispatch();
  const creating = useSelector(state => state.ticketCreate.creating);
  const creatingError = useSelector(state => state.ticketCreate.creatingError);
  const creatingErrorMessage = useSelector(
    state => state.ticketCreate.creatingErrorMessage
  );

  const defaultValues = useMemo(
    () => ({
      subject: 'Feedback for the Frontera Portal',
      problem_description: '',
      name: authenticatedUser
        ? `${authenticatedUser.first_name} ${authenticatedUser.last_name}`
        : '',
      email: authenticatedUser ? authenticatedUser.email : ''
    }),
    [authenticatedUser]
  );

  return (
    <Formik
      enableReinitialize
      initialValues={defaultValues}
      validationSchema={formSchema}
      onSubmit={(values, { resetForm }) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => formData.append(key, values[key]));
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
      {({ isSubmitting, isValid }) => {
        return (
          <Form styleName="feedback-form">
            <FormGroup>
              <FormField name="name" label="Full Name" required disabled />
              <FormField name="email" label="Email" required disabled />
              <FormField
                name="problem_description"
                label="Feedback"
                type="textarea"
                styleName="comments-textarea"
                required
              />
            </FormGroup>
            <div className="ticket-create-button-row">
              {creatingError && (
                <Alert color="warning">
                  Feedback creating error: {creatingErrorMessage}
                </Alert>
              )}
              <Button
                type="submit"
                color="primary"
                disabled={!isValid || isSubmitting || creating}
              >
                {creating && (
                  <Spinner
                    size="sm"
                    color="white"
                    data-testid="creating-spinner"
                  />
                )}
                Submit
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

FeedbackForm.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  authenticatedUser: PropTypes.object
};

FeedbackForm.defaultProps = {
  authenticatedUser: null
};

export default FeedbackForm;
