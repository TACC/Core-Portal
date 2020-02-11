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
import { instanceOf, object } from 'prop-types';
import { startCase } from 'lodash';
import { singular } from 'pluralize';

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

export const RequiredInformationForm = () => {
  const {
    data: { demographics: initialValues },
    fields
  } = useSelector(state => state.profile);
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
        {Object.keys(fields).map(field => (
          <FormGroup key={field}>
            <Label>{startCase(singular(field))}</Label>
            <BootstrapInput type="select">
              {fields[field].map(item => (
                <option key={item}>{item}</option>
              ))}
            </BootstrapInput>
          </FormGroup>
        ))}
      </Form>
    </Formik>
  );
};
