import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFormikContext } from 'formik';
import { SectionTableWrapper, Section, Button } from '_common';
import styles from '../PublicationWizard.module.scss';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

// Reviewer step: approve/publish, publish a new version, or reject a request.
const SubmitPublicationReview = ({ callbackUrl, contact }) => {
  const { submitForm, setFieldValue, resetForm } = useFormikContext();

  const { doi } = useSelector((state) => state.projects.metadata);

  const history = useHistory();

  const [submitDisabled, setSubmitDisabled] = useState(false);

  const { canPublish = false } =
    useSelector((state) => state.workbench.config) || {};

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

  const handleVersioning = () => {
    setFieldValue('versionApproved', true);
    setSubmitDisabled(true);
    submitForm();
  };

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Confirm Publication Review</div>}
    >
      <Section contentLayoutName={'oneColumn'}>
        {contact && <div>{contact}</div>}
        <div className={styles['submit-div']}>
          {doi ? (
            <Button
              type="primary"
              className={styles['submit-button']}
              disabled={submitDisabled}
              isLoading={isApproveLoading}
              onClick={handleVersioning}
            >
              Publish New Version
            </Button>
          ) : (
            <Button
              type="primary"
              className={styles['submit-button']}
              disabled={submitDisabled || !canPublish}
              isLoading={isApproveLoading}
              onClick={handleApproveAndPublish}
            >
              Approve and Publish
            </Button>
          )}
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

SubmitPublicationReview.propTypes = {
  callbackUrl: PropTypes.string,
  contact: PropTypes.node,
};

export const SubmitPublicationReviewStep = ({ callbackUrl, contact }) => ({
  id: 'submit_publication_review',
  name: 'Submit Publication Review',
  render: (
    <SubmitPublicationReview callbackUrl={callbackUrl} contact={contact} />
  ),
  initialValues: {},
});

export default SubmitPublicationReview;
