/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useSelector } from 'react-redux';
import {
  Form,
  FormGroup,
  Label,
  Input as BootstrapInput,
  FormFeedback
} from 'reactstrap';
import { Formik, Field } from 'formik';
import { object as obj, string as str } from 'yup';
import { isEmpty } from 'lodash';
import { instanceOf, object, string } from 'prop-types';
import LoadingSpinner from '../_common/LoadingSpinner';

export const Input = ({ field, form: { touched, errors } }) => {
  const { name } = field;
  return (
    <>
      <BootstrapInput invalid={!!(touched[name] && errors[name])} {...field} />

      {touched[name] && errors[name] && (
        <FormFeedback>{errors[name]}</FormFeedback>
      )}
    </>
  );
};
Input.propTypes = {
  field: instanceOf(object).isRequired,
  form: instanceOf(object).isRequired
};

export const SelectField = ({ name }) => {
  const { fields } = useSelector(state => state.profile);
  console.log(fields);
  const [label, options] = React.useMemo(() => {
    switch (name) {
      case 'institution':
        return ['Institution', fields.institutions];
      case 'country':
        return ['Country of Residence', fields.countries];
      case 'citizenship':
        return ['Country of Citizenship', fields.countries];
      case 'ethnicity':
        return ['Ethnicity', fields.ethnicities];
      case 'gender':
        return ['Gender', fields.genders];
      default:
        return ['Loading', []];
    }
  }, [fields]);
  if (isEmpty(fields)) return <LoadingSpinner />;
  return (
    <FormGroup>
      <Label>{label}</Label>
      <Field as="select" name={name} className="form-control">
        {options.map(item => (
          <option key={item}>{item}</option>
        ))}
      </Field>
    </FormGroup>
  );
};
SelectField.propTypes = { name: string.isRequired };

export const RequiredInformationForm = () => {
  const {
    data: { demographics: initialValues }
  } = useSelector(state => state.profile);
  console.log(initialValues);
  const validationSchema = obj().shape({
    firstName: str()
      .min(2, 'Too Short!')
      .max(50, 'Too Long!')
      .required('Required'),
    lastName: str()
      .min(2, 'Too Short!')
      .max(50, 'Too Long!')
      .required('Required'),
    email: str()
      .email('Please enter an invalid email')
      .required('Required'),
    phone: str().matches(
      /^((\\+[1-9]{1,4}[ \\-]*)|(\\([0-9]{2,3}\\)[ \\-]*)|([0-9]{2,4})[ \\-]*)*?[0-9]{3,4}?[ \\-]*[0-9]{3,4}?$/,
      'Please enter a valid phone number'
    )
  });
  const attributes = { initialValues, validationSchema };
  return (
    <Formik {...attributes}>
      <Form>
        <FormGroup>
          <Label>First Name</Label>
          <Field type="text" name="firstName" component={Input} />
        </FormGroup>
        <FormGroup>
          <Label>Last Name</Label>
          <Field type="text" name="lastName" component={Input} />
        </FormGroup>
        <FormGroup>
          <Label>Email</Label>
          <Field type="email" name="email" component={Input} />
        </FormGroup>
        <FormGroup>
          <Label>Phone No.</Label>
          <Field type="number" name="phone" component={Input} />
        </FormGroup>
        <SelectField name="institution" />
        <SelectField name="country" />
        <SelectField name="citizenship" />
      </Form>
    </Formik>
  );
};
