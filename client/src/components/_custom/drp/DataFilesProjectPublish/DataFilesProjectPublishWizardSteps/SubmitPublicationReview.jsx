import React, { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { SectionTableWrapper, Section, Button } from '_common';
import * as Yup from 'yup';
import styles from './DataFilesProjectPublishWizard.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

const validationSchema = Yup.object({});

const SubmitPublicationReview = ({ callbackUrl }) => {
  const { submitForm, setFieldValue, resetForm } = useFormikContext();

  const history = useHistory();

  const [submitDisabled, setSubmitDisabled] = useState(false);

  const {
    isApproveLoading,
    isRejectLoading,
    isApproveSuccess,
    isRejectSuccess,
  } = useSelector((state) => {
    const { name, loading, error, result } = state.publications.operation;
    return {
      isApproveLoading: name === 'approve' && loading,
      isRejectLoading: name === 'reject' && loading,
      isApproveSuccess: name === 'approve' && !loading && !error && result,
      isRejectSuccess: name === 'reject' && !loading && !error && result,
    };
  });

  useEffect(() => {
    if (isApproveSuccess || isRejectSuccess) {
      setSubmitDisabled(false);
      resetForm();
      history.replace(callbackUrl);
    }
  }, [isApproveSuccess, isRejectSuccess]);

  const handleApproveAndPublish = () => {
    setFieldValue('publicationApproved', true);
    setSubmitDisabled(true);
    submitForm();
  };

  const handleReject = () => {
    setFieldValue('publicationRejected', true);
    setSubmitDisabled(true);
    submitForm();
  };

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
            isLoading={isApproveLoading}
            onClick={handleApproveAndPublish}
          >
            Approve and Publish
          </Button>
          <Button
            type="secondary"
            className={styles['submit-button']}
            disabled={submitDisabled}
            isLoading={isRejectLoading}
            onClick={handleReject}
          >
            Reject
          </Button>
        </div>
      </Section>
    </SectionTableWrapper>
  );
};

export const SubmitPublicationReviewStep = ({ callbackUrl }) => ({
  id: 'submit_publication_review',
  name: 'Submit Publication Review',
  render: <SubmitPublicationReview callbackUrl={callbackUrl} />,
  initialValues: {},
  validationSchema,
});
