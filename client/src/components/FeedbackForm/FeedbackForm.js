import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Formik, Form } from 'formik';
import {
  Alert,
  Button,
  Col,
  Container,
  FormGroup,
  Row,
  Spinner
} from 'reactstrap';
import { FormField } from '_common';
import * as Yup from 'yup';
import './FeedbackForm.scss';

const formSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Required'),
  comments: Yup.string().required('Required')
});

const FeedbackForm = ({ authenticatedUser }) => {
  const defaultValues = useMemo(
    () => ({
      comments: '',
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
          <Form className="feedback-form">
            <FormGroup>
              <FormField name="name" label="Name" required />
              <FormField name="email" label="Email Address" required />
              <FormField
                name="comments"
                label="Comments"
                type="textarea"
                className="comments-textarea"
                required
              />
            </FormGroup>
          </Form>
        );
      }}
    </Formik>
  );
};

FeedbackForm.propTypes = {
  authenticatedUser: PropTypes.object
};

FeedbackForm.defaultProps = {
  authenticatedUser: null
};

export default FeedbackForm;
