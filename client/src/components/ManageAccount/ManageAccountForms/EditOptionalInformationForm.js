import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from 'reactstrap';
import { Formik, Form } from 'formik';
import { object as obj, string as str } from 'yup';
import LoadingSpinner from '_common/LoadingSpinner';
import { ManageAccountInput } from './ManageAccountFields';

export default function() {
  const {
    data: { demographics },
    fields
  } = useSelector(state => state.profile);
  const dispatch = useDispatch();
  const formSchema = obj().shape({
    orcidId: str(),
    bio: str(),
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
        <ManageAccountInput label="Website" name="website" />
        <ManageAccountInput label="Orcid ID" name="orcidId" />
        <ManageAccountInput
          label="Professional Level"
          name="professionalLevel"
          type="select"
        />
        <ManageAccountInput label="Bio" name="bio" type="textarea" />
        <Button type="submit">Submit</Button>
      </Form>
    </Formik>
  );
}
