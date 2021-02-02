import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from 'reactstrap';
import { object as obj, string as str, ref } from 'yup';
import { Formik, Form } from 'formik';
import { isEmpty } from 'lodash';
import { bool, oneOfType, func, instanceOf, shape } from 'prop-types';
import { LoadingSpinner, Message } from '_common';
import { ManageAccountInput } from './ManageAccountFields';

const ChangePasswordFormBody = ({ canSubmit, formRef }) => {
  const isChecking = useSelector(state => state.profile.checkingPassword);
  const Requirements = () => (
    <div style={{ color: '#707070', fontStyle: 'italic' }}>
      <span>Passwords must meet the following criteria:</span>
      <ul style={{ paddingLeft: '1rem' }}>
        <li>Must not contain your username or parts of your full name;</li>
        <li>Must be a minimum of 8 characters in length</li>
        <li>
          Must contain characters from at least three of the following:
          Uppercase letters, lowercase letters, numbers, symbols
        </li>
      </ul>
    </div>
  );
  return (
    <Form ref={formRef} aria-label="change-password-form">
      <ManageAccountInput
        label="Current Password"
        name="currentPW"
        type="password"
        aria-label="current-password"
      />
      <ManageAccountInput
        label="New Password"
        name="newPW"
        type="password"
        aria-label="new-password"
      />
      <ManageAccountInput
        label="Confirm New Password"
        name="confirmNewPW"
        type="password"
        aria-label="confirm-new-password"
      />
      <Requirements />
      <Button
        className="manage-account-submit-button"
        type="submit"
        data-testid="submit-button"
        disabled={!canSubmit}
      >
        {isChecking && <LoadingSpinner placement="inline" />}
        <span style={isChecking ? { marginLeft: '1rem' } : {}}>
          Change Password
        </span>
      </Button>
    </Form>
  );
};
ChangePasswordFormBody.propTypes = {
  canSubmit: bool.isRequired,
  formRef: oneOfType([
    func,
    shape({
      current: instanceOf(Element)
    })
  ]).isRequired
};

export default function() {
  const { restrictions, checks } = useSelector(state => {
    const { data } = state.profile;
    const { username, firstName, lastName } = data.demographics;
    return {
      restrictions: { username, firstName, lastName },
      checks: {
        error: state.profile.errors.password,
        success: state.profile.success.password
      }
    };
  });
  const dispatch = useDispatch();
  const formRef = React.useRef(null);
  const handleSubmit = (values, { setSubmitting, resetForm }) => {
    dispatch({
      type: 'CHANGE_PASSWORD',
      values
    });
    setSubmitting(false);
  };

  const resetForm = () => {
    if (checks.success) {
      const reset = new Event('reset');
      formRef.current.dispatchEvent(reset);
    }
  };

  React.useEffect(() => {
    resetForm();
  }, [checks]);
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
        /(?=.{8,})((?=.*\d)(?=.*[a-z])(?=.*[A-Z])|(?=.*\d)(?=.*[a-zA-Z])(?=.*[\W_])|(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])).*/,
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
    <>
      <Message type="warn">
        <p>
          <strong>Please Note:</strong> This form requests a reset to your TACC
          Account password. Changes to this password will affect your TACC
          Account <em>as a whole</em>, not just the Portal.
        </p>
      </Message>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={formSchema}
      >
        {({ errors }) => (
          <ChangePasswordFormBody
            formRef={formRef}
            canSubmit={hasErrors(errors)}
          />
        )}
      </Formik>
    </>
  );
}
