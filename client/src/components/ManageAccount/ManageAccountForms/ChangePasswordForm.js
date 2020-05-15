import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from 'reactstrap';
import { object as obj, string as str, ref } from 'yup';
import { Formik, Form } from 'formik';
import { isEmpty } from 'lodash';
import { bool } from 'prop-types';
import { LoadingSpinner } from '_common';
import { ManageAccountInput } from './ManageAccountFields';

const ChangePasswordFormBody = ({ canSubmit }) => {
  const isChecking = useSelector(({ profile }) => profile.checkingPassword);
  const Requirements = () => (
    <div style={{ color: '#707070', fontStyle: 'italic' }}>
      <span>Passwords must meet the following criteria:</span>
      <ul style={{ paddingLeft: '1rem' }}>
        <li>Must not contain your username or parts of your full name;</li>
        <li>Must be a minimum of 8 characters in length</li>
        <li>Must contain characters from at least three of the following:</li>
        <li style={{ marginLeft: '1rem' }}>
          Uppercase letters, lowercase letters, numbers, symbols
        </li>
      </ul>
    </div>
  );
  return (
    <Form className="change-password-form">
      <ManageAccountInput
        label="Current Password"
        name="currentPW"
        type="password"
        placeholder="Current Password"
      />

      <ManageAccountInput
        label="New Password"
        name="newPW"
        type="password"
        placeholder="New Password"
      />
      <ManageAccountInput
        label="Confirm New Password"
        name="confirmNewPW"
        type="password"
        placeholder="Confirm New Password"
      />
      <Requirements />
      <Button
        className="manage-account-submit-button"
        type="submit"
        style={{ alignSelf: 'flex-end' }}
        disabled={!canSubmit}
      >
        {isChecking ? <LoadingSpinner placement="inline" /> : 'Change Password'}
      </Button>
    </Form>
  );
};
ChangePasswordFormBody.propTypes = { canSubmit: bool.isRequired };

export default function() {
  const { restrictions } = useSelector(({ profile: { data } }) => {
    const { username, firstName, lastName } = data.demographics;
    return {
      restrictions: { username, firstName, lastName }
    };
  });
  const dispatch = useDispatch();
  const handleSubmit = (values, { setSubmitting, resetForm }) => {
    dispatch({
      type: 'CHANGE_PASSWORD',
      values,
      callback: params => {
        setSubmitting(false);
        if (params.reset) resetForm();
      }
    });
  };
  const formSchema = obj().shape({
    currentPW: str().required('Please enter your current password'),
    newPW: str()
      .min(8, 'Must be a minimum of 8 characters in length')
      .test('check-first-name', 'Can not contain your first name', value => {
        const matcher = new RegExp(restrictions.firstName, 'i');
        return !matcher.test(value);
      })
      .test('check-last-name', 'Can not contain your last name', value => {
        const matcher = new RegExp(restrictions.lastName, 'i');
        return !matcher.test(value);
      })
      .test('check-username', 'Can not contain your username', value => {
        const matcher = new RegExp(restrictions.username, 'i');
        return !matcher.test(value);
      })
      .notOneOf(
        [ref('currentPW')],
        'Your new password must be different from your old password'
      )
      .matches(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
        'Must Contain at least three of the following: One Uppercase, One Lowercase, One Number and One special character'
      )
      .required('Required'),
    confirmNewPW: str()
      .oneOf([ref('newPW')], 'Passwords do not match')
      .required('Required')
  });
  const initialValues = {
    currentPW: '',
    newPW: '',
    confirmNewPW: ''
  };
  const hasErrors = errors => isEmpty(Object.keys(errors));
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={formSchema}
    >
      {({ errors }) => <ChangePasswordFormBody canSubmit={hasErrors(errors)} />}
    </Formik>
  );
}
