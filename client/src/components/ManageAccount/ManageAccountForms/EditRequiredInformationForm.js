/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Label, FormGroup, Input, FormText } from 'reactstrap';
import { Formik, Field, Form, useField } from 'formik';
import { object as obj, string as str } from 'yup';
import { pick } from 'lodash';
import { string } from 'prop-types';
import LoadingSpinner from '../../_common/LoadingSpinner';

export const FIELD_PROPTYPES = { label: string.isRequired };

export const renderOptions = ([value, label], arr, index) => (
  <option key={label} {...{ value, label }} />
);

export const useOptions = l => {
  switch (l) {
    case 'Institution':
      return { name: 'institutionId', key: 'institutions' };
    case 'Position/Title':
      return { name: 'title', key: 'titles' };
    case 'Ethnicity':
      return { name: 'ethnicity', key: 'ethnicities' };
    case 'Gender':
      return { name: 'gender', key: 'genders' };
    case 'Citizenship':
      return { name: 'citizenshipId', key: 'countries' };
    default:
      return { name: 'countryId', key: 'countries' };
  }
};

export const SelectField = ({ label, ...props }) => {
  const { name, key } = useOptions(label);
  const options = useSelector(state => state.profile.fields[key]);
  return (
    <FormGroup>
      <Label>{label}</Label>
      <Field
        as="select"
        name={name}
        className="form-control form-control-sm"
        disabled={label === 'Citizenship'}
      >
        {options.map(renderOptions)}
      </Field>
    </FormGroup>
  );
};
SelectField.propTypes = FIELD_PROPTYPES;

export const TextField = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  return (
    <FormGroup>
      <Label>{label}</Label>
      <Input
        {...field}
        className={`${meta.error ? 'is-invalid' : ''}`}
        bsSize="sm"
      />
      {meta.touched && meta.error ? (
        <FormText color="danger">{meta.error}</FormText>
      ) : null}
    </FormGroup>
  );
};
TextField.propTypes = FIELD_PROPTYPES;

export default function() {
  const { initialValues, fields } = useSelector(({ profile }) => {
    const { data } = profile;
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
      fields: profile.fields,
      initialValues: {
        ...initial,
        institution: initial.institutionId,
        country: initial.countryId,
        citizenship: initial.citizenshipId
      }
    };
  });
  const dispatch = useDispatch();
  const validationSchema = obj().shape({
    firstName: str()
      .min(2)
      .required(),
    lastName: str()
      .min(1)
      .required(),
    email: str()
      .required('Please enter your email address')
      .email('Please enter a valid email address'),
    phone: str().matches(
      /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
      'Phone number is not valid'
    )
  });
  const attributes = { initialValues, validationSchema };
  if (!fields.ethnicities) return <LoadingSpinner />;
  return (
    <Formik
      {...attributes}
      onSubmit={(values, { setSubmitting }) => {
        dispatch({
          type: 'EDIT_REQUIRED_INFORMATION',
          values,
          callback: () => setSubmitting(false)
        });
      }}
    >
      {props => {
        return (
          <Form>
            {/* TAS Fields - Text */}
            <TextField label="First Name" name="firstName" />
            <TextField label="Last Name" name="lastName" />
            <TextField label="Email Address" name="email" />
            <TextField label="Phone Number" name="phone" />
            {/* TAS Fields - Select */}
            <SelectField label="Institution" />
            <SelectField label="Position/Title" />
            <SelectField label="Residence" />
            <SelectField label="Citizenship" />
            {/* Django Fields */}
            <SelectField label="Ethnicity" />
            <SelectField label="Gender" />
            <Button type="submit">Submit</Button>
          </Form>
        );
      }}
    </Formik>
  );
}
