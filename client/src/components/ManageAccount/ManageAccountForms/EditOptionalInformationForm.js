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
  } = useSelector(state => {
    return {
      ...state.profile,
      isEditing: state.profile.editing
    };
  });
  const dispatch = useDispatch();
  const formSchema = obj().shape({
    orcidId: str(),
    bio: str(),
    website: str()
  });
  const handleSubmit = (values, { setSubmitting }) => {
    dispatch({ type: 'EDIT_OPTIONAL_INFORMATION', values });
    setSubmitting(false);
  };
  const initialValues = {
    website: demographics.website || '',
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
      <Form aria-label="edit-optional-information-form">
        <ManageAccountInput
          label="Website"
          name="website"
          aria-label="website"
        />
        <ManageAccountInput
          label="Orcid ID"
          name="orcidId"
          aria-label="orcid-id"
        />
        <ManageAccountInput
          label="Professional Level"
          name="professionalLevel"
          type="select"
          aria-label="professional-level"
        />
        <ManageAccountInput
          label="Bio"
          name="bio"
          type="textarea"
          aria-label="bio"
        />
        <Button
          type="submit"
          className="manage-account-submit-button"
          aria-label="edit-optional-information-submit-button"
        >
          {isEditing && <LoadingSpinner placement="inline" />}
          <span style={isEditing ? { marginLeft: '1rem' } : {}}>Submit</span>
        </Button>
      </Form>
    </Formik>
  );
}
