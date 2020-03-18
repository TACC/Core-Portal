/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Label } from 'reactstrap';
import { Formik, Field, Form } from 'formik';
import { object as obj, string as str } from 'yup';
import LoadingSpinner from '../../_common/LoadingSpinner';

export default function() {
  const {
    data: { demographics },
    fields
  } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  const formSchema = obj().shape({
    professionalLevel: str(),
    website: str().url('Please enter a valid URL')
  });

  if (!fields.professionalLevels) return <LoadingSpinner />;
  return (
    <Formik
      initialValues={{
        website: demographics.website || '',
        bio: demographics.bio || '',
        orcidId: demographics.orcid_id || '',
        professionalLevel: demographics.professional_level || ''
      }}
      validationSchema={formSchema}
      onSubmit={(values, { setSubmitting }) => {
        dispatch({ type: 'EDIT_OPTIONAL_INFORMATION', values });
        setSubmitting(false);
      }}
    >
      <Form>
        <div className="form-group">
          <Label>Professional Level</Label>
          <Field as="select" name="professionalLevel" className="form-control">
            {fields.professionalLevels.map(([value, label]) => (
              <option key={label} {...{ value, label }} />
            ))}
          </Field>
        </div>
        <div className="form-group">
          <Label>Website</Label>
          <Field name="website" className="form-control" />
        </div>
        <div className="form-group">
          <Label>Orcid ID</Label>
          <Field name="orcidId" className="form-control" />
        </div>
        <div className="form-group">
          <Label>Bio</Label>
          <Field name="bio" as="textarea" className="form-control" />
        </div>
        <Button type="submit">Submit</Button>
      </Form>
    </Formik>
  );
}
