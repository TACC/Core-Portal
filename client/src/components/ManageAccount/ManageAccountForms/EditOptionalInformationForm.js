import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from 'reactstrap';
import { Formik, Form } from 'formik';
import { object as obj, string as str } from 'yup';
import { LoadingSpinner } from '_common';
import { ManageAccountInput } from './ManageAccountFields';

export default function() {
  const {
    data: { demographics },
    fields,
    isEditing
  } = useSelector(({ profile }) => {
    return {
      ...profile,
      isEditing: profile.editing
    };
  });
  const dispatch = useDispatch();
  const formSchema = obj().shape({
    orcidId: str(),
    bio: str(),
    website: str().matches(
      new RegExp(
        '^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?'
      ),
      'Please enter a valid URL'
    )
  });
  const handleSubmit = (values, { setSubmitting }) => {
    dispatch({ type: 'EDIT_OPTIONAL_INFORMATION', values });
    setSubmitting(false);
  };
  const initialValues = {
    website: demographics.website || 'http://',
    bio: demographics.bio || '',
    orcidId: demographics.orcid_id || '',
    professionalLevel: demographics.professional_level || ''
  };
  if (!fields.professionalLevels) return <LoadingSpinner />;
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={formSchema}
      onSubmit={handleSubmit}
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
        <Button type="submit" className="manage-account-submit-button">
          {isEditing ? <LoadingSpinner placement="inline" /> : 'Submit'}
        </Button>
      </Form>
    </Formik>
  );
}
