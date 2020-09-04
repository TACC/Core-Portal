import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = authenticatedUser != null;
  const creating = useSelector(state => state.ticketCreate.creating);
  const creatingError = useSelector(state => state.ticketCreate.creatingError);
  const creatingErrorMessage = useSelector(
    state => state.ticketCreate.creatingErrorMessage
  );
  const creatingSuccess = useSelector(
    state => state.ticketCreate.creatingSuccess
  );
  const createdTicketId = useSelector(
    state => state.ticketCreate.createdTicketId
  );

  const url = location.pathname;
  const defaultValues = useMemo(
    () => ({
      subject: 'Feedback',
      url: url || '',
      problem_description: '',
      first_name: authenticatedUser ? authenticatedUser.first_name : '',
      last_name: authenticatedUser ? authenticatedUser.last_name : '',
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
            refreshTickets: isAuthenticated
          }
        });
      }}
    >
      {({ isSubmitting, isValid }) => {
        return (
          <Form styleName="feedback-form">
            <FormField type="hidden" name="last_name" />
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
              {creatingSuccess && (
                <CreatedFeedbackInformation
                  ticketId={createdTicketId}
                  isAuthenticated={isAuthenticated}
                />
              )}
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

function CreatedFeedbackInformation({ isAuthenticated, ticketId }) {
  if (!ticketId) {
    return null;
  }
  return (
    <Alert color="success">
      Feedback (#{ticketId}) was received. Thank you!
    </Alert>
  );
}

CreatedFeedbackInformation.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  ticketId: PropTypes.number.isRequired
};

export default FeedbackForm;
