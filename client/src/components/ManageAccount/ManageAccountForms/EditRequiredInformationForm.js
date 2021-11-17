import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from 'reactstrap';
import { Formik, Form } from 'formik';
import { object as obj, string as str } from 'yup';
import { pick, isEmpty } from 'lodash';
import { LoadingSpinner } from '_common';
import { bool } from 'prop-types';
import { ManageAccountInput } from './ManageAccountFields';

const RequiredInformationFormBody = ({ canSubmit }) => {
  const isEditing = useSelector(state => state.profile.editing);
  return (
    <Form>
      {/* TAS Fields - Text */}
      <ManageAccountInput label="First Name" name="firstName" />
      <ManageAccountInput label="Last Name" name="lastName" />
      <ManageAccountInput
        label="Email Address"
        name="email"
        aria-label="email"
      />
      <ManageAccountInput
        label="Phone Number"
        name="phone"
        aria-label="phone"
      />
      {/* TAS Fields - Select */}
      <ManageAccountInput
        label="Institution"
        name="institutionId"
        type="select"
      />
      <ManageAccountInput label="Position/Title" name="title" type="select" />
      <ManageAccountInput label="Residence" name="countryId" type="select" />
      {/* Django Fields */}
      <ManageAccountInput label="Ethnicity" name="ethnicity" type="select" />
      <ManageAccountInput label="Gender" name="gender" type="select" />
      <Button
        type="submit"
        className="manage-account-submit-button"
        disabled={!canSubmit}
        aria-label="required-submit"
      >
        {isEditing && <LoadingSpinner placement="inline" />}
        <span style={isEditing ? { marginLeft: '1rem' } : {}}>Submit</span>
      </Button>
    </Form>
  );
};
RequiredInformationFormBody.propTypes = {
  canSubmit: bool.isRequired
};

export default function() {
  const { initialValues, fields } = useSelector(state => {
    const { data } = state.profile;
    const { demographics } = data;
    const initial = pick(demographics, [
      'firstName',
      'lastName',
      'email',
      'phone',
      'ethnicity',
      'gender',
      'institutionId',
      'countryId',
      'citizenshipId',
      'title',
      'institutionId'
    ]);
    return {
      fields: state.profile.fields,
      initialValues: {
        ...initial,
        institution: initial.institutionId,
        country: initial.countryId
      },
      isEditing: state.profile.editing
    };
  });
  const dispatch = useDispatch();
  const formSchema = obj().shape({
    firstName: str()
      .min(2)
      .required('Please enter your first name'),
    lastName: str()
      .min(1)
      .required('Please enter your last name'),
    email: str()
      .required('Please enter your email address')
      .email('Please enter a valid email address'),
    /* eslint-disable no-useless-escape */
    phone: str()
      .matches(
        /^[+]?(1\-|1\s|1|\d{3}\-|\d{3}\s|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/g,
        'Phone number is not valid'
      )
      .required('Please enter your phone number'),
    // Schema for 'select' fields
    gender: str().required('Please select an option'),
    ethnicity: str().required('Please select an option'),
    countryId: str().required('Please select a country'),
    institutionId: str().required('Please select an institution'),
    title: str().required('Please select your title')
  });
  const handleSubmit = (values, { setSubmitting }) => {
    dispatch({ type: 'CLEAR_FORM_MESSAGES' });
    dispatch({
      type: 'EDIT_REQUIRED_INFORMATION',
      values
    });
    setSubmitting(false);
  };
  const hasErrors = errors => isEmpty(Object.keys(errors));
  if (!fields.ethnicities) return <LoadingSpinner />;
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={formSchema}
      onSubmit={handleSubmit}
    >
      {({ errors }) => (
        <RequiredInformationFormBody canSubmit={hasErrors(errors)} />
      )}
    </Formik>
  );
}
