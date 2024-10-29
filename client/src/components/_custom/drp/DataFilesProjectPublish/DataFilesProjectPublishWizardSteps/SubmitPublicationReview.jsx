import React, { useEffect, useState } from 'react';
import { FormGroup, Input } from 'reactstrap';
import { useFormikContext } from 'formik';
import { SectionTableWrapper, Section, Button } from '_common';
import * as Yup from 'yup';
import styles from './DataFilesProjectPublishWizard.module.scss';
import { useSelector } from 'react-redux';

const validationSchema = Yup.object({
  reviewInfo: Yup.boolean().oneOf([true], 'Must be checked'),
  reviewRelatedPublications: Yup.boolean().oneOf([true], 'Must be checked'),
});

const SubmitPublicationReview = () => {
  const { handleChange, handleBlur, values, submitForm } = useFormikContext();

  const [submitDisabled, setSubmitDisabled] = useState(true);

  const { loading, error } = useSelector((state) => {
    if (
      state.projects.operation &&
      state.projects.operation.name === 'publicationRequest'
    ) {
      return state.projects.operation;
    }
    return {
      loading: false,
      error: false,
    };
  });

  useEffect(() => {
    validationSchema.isValid(values).then((valid) => {
      setSubmitDisabled(!valid);
    });
  }, [values]);

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Confirm Publication Review</div>}
    >
      <Section contentLayoutName={'oneColumn'}>
        <div>
          If you have any doubts about the process please contact the data
          curator Maria Esteva before submitting the data for publication.
        </div>
        <div className={styles['submit-div']}>
          <Button
            type="primary"
            className={styles['submit-button']}
            disabled={submitDisabled}
            isLoading={loading}
            onClick={submitForm}
          >
            Approve and Publish
          </Button>
          <Button
            type="secondary"
            className={styles['submit-button']}
            disabled={submitDisabled}
            isLoading={loading}
            onClick={submitForm}
          >
            Reject
          </Button>
        </div>
      </Section>
    </SectionTableWrapper>
  );
};

export const SubmitPublicationReviewStep = () => ({
  id: 'submit_publication_review',
  name: 'Submit Publication Review',
  render: <SubmitPublicationReview />,
  initialValues: {},
  validationSchema,
});
