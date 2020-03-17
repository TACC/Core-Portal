import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormGroup, Label, Input as BootstrapInput, Button } from 'reactstrap';
import * as Yup from 'yup';
import { Formik, useField, Form } from 'formik';
import { string } from 'prop-types';
import LoadingSpinner from '_common/LoadingSpinner';

/* eslint-disable react/jsx-props-no-spreading */
const Input = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  return (
    <>
      <FormGroup>
        <Label>{label}</Label>
        <BootstrapInput {...field} {...props} />
        {meta.touched && meta.error ? <span>{meta.error}</span> : null}
      </FormGroup>
    </>
  );
};
Input.propTypes = {
  label: string.isRequired
};

export default function() {
  const { checking } = useSelector(({ profile }) => {
    const { demographics } = profile.data;
    return { ...demographics, checking: profile.checkingPassword };
  });
  const dispatch = useDispatch();
  const formSchema = Yup.object({
    currentPW: Yup.string().required('Please enter your current password'),
    newPW: Yup.string()
      .min(8, 'Must be a minimum of 8 characters in length')
      .required('Required'),
    confirmNewPW: Yup.string().oneOf(
      [Yup.ref('newPW')],
      'Passwords do not match'
    )
  });
  return (
    <Formik
      initialValues={{
        currentPW: '',
        newPW: '',
        confirmNewPW: ''
      }}
      onSubmit={(values, { setSubmitting, resetForm }) => {
        const { currentPW, newPW } = values;
        dispatch({
          type: 'CHANGE_PASSWORD',
          options: {
            method: 'POST',
            body: JSON.stringify({
              currentPW,
              newPW
            })
          }
        });
        setSubmitting(false);
        resetForm();
      }}
      validationSchema={formSchema}
    >
      <Form
        style={{
          fontSize: '14px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Input
          label="Current Password"
          name="currentPW"
          type="password"
          placeholder="Current Password"
        />
        <Input
          label="New Password"
          name="newPW"
          type="password"
          placeholder="New Password"
        />
        <Input
          label="Confirm New Password"
          name="confirmNewPW"
          type="password"
          placeholder="Confirm New Password"
        />
        <div style={{ color: '#707070' }}>
          <span>Passwords must meet the following criteria:</span>
          <ul style={{ listStyleType: 'none', paddingLeft: '1rem' }}>
            <li>Must not contain your username or parts of your full name;</li>
            <li>Must be a minimum of 8 characters in length</li>
            <li>
              Must contain characters from at least three of the following:
            </li>
            <li>Uppercase letters, lowercase letters, numbers, symbols</li>
          </ul>
        </div>
        <Button
          className="change-pw-button"
          type="submit"
          style={{ alignSelf: 'flex-end' }}
        >
          {checking ? <LoadingSpinner placement="inline" /> : 'Change Password'}
        </Button>
      </Form>
    </Formik>
  );
}
