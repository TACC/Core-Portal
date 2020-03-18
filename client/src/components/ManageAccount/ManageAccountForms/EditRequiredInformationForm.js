/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Label } from 'reactstrap';
import { Formik, Field, Form } from 'formik';
import { object as obj, string as str } from 'yup';
import LoadingSpinner from '../../_common/LoadingSpinner';

export default function() {
  const {
    data: { demographics: initialValues },
    fields
  } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  const requiredMsg = 'Please select an option';
  const validationSchema = obj().shape({
    ethnicity: str().required(requiredMsg),
    gender: str().required(requiredMsg)
  });
  const attributes = { initialValues, validationSchema };
  if (!fields.ethnicities) return <LoadingSpinner />;
  return (
    <Formik
      {...attributes}
      onSubmit={(values, { setSubmitting }) => {
        dispatch({
          type: 'EDIT_REQUIRED_INFORMATION',
          values
        });
        setSubmitting(false);
      }}
    >
      <Form>
        <div className="form-group">
          <Label>Ethnicity</Label>
          <Field as="select" name="ethnicity" className="form-control">
            {fields.ethnicities.map(([value, label]) => (
              <option key={label} {...{ value, label }} />
            ))}
          </Field>
        </div>

        <div className="form-group">
          <Label>Gender</Label>
          <Field as="select" name="gender" className="form-control">
            {fields.genders.map(([value, label]) => (
              <option key={label} {...{ value, label }} />
            ))}
          </Field>
        </div>
        <Button type="submit">Submit</Button>
      </Form>
    </Formik>
  );
}
