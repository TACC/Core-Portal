import React, { useEffect, useState } from 'react';
import { FormGroup, Input } from 'reactstrap';
import { useFormikContext } from 'formik';
import { SectionTableWrapper, Section, Button } from '_common';
import * as Yup from 'yup';
import styles from './DataFilesProjectPublishWizard.module.scss';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

const validationSchema = Yup.object({
  reviewInfo: Yup.boolean().oneOf([true], 'Must be checked'),
  reviewRelatedPublications: Yup.boolean().oneOf([true], 'Must be checked'),
});

const SubmitPublicationRequest = ({ callbackUrl }) => {
  const { handleChange, handleBlur, values, submitForm, resetForm } = useFormikContext();
  const history = useHistory();

  const [submitDisabled, setSubmitDisabled] = useState(true);

  const { loading, error, result } = useSelector((state) => {
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
    if (result && !error && !loading) {
      setSubmitDisabled(false);
      resetForm();
      history.replace(callbackUrl);
    }
  }, [result, error, loading]);

  useEffect(() => {
    validationSchema.isValid(values).then((valid) => {
      setSubmitDisabled(!valid);
    });
  }, [values]);

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Submit Publication Request</div>}
    >
      <FormGroup check>
        <Input
          id="reviewInfo"
          name="reviewInfo"
          type="checkbox"
          value={values.reviewInfo}
          onChange={handleChange}
          onBlur={handleBlur}
          checked={values.reviewInfo}
        />
        <span>
          {' '}
          I have reviewed the information and confirm that it is correct.
          <span className={styles['required-text']}>*</span>
        </span>
      </FormGroup>
      <FormGroup check>
        <Input
          id="reviewRelatedPublications"
          name="reviewRelatedPublications"
          type="checkbox"
          value={values.reviewRelatedPublications}
          onChange={handleChange}
          onBlur={handleBlur}
          checked={values.reviewRelatedPublications}
        />
        <span>
          {' '}
          I have reviewed related publications/ I do not have any related
          publications.<span className={styles['required-text']}>*</span>
        </span>
      </FormGroup>
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
            Submit Publication Request
          </Button>
        </div>
      </Section>
    </SectionTableWrapper>
  );
};

export const SubmitPublicationRequestStep = ({ callbackUrl }) => ({
  id: 'submit_publication_request',
  name: 'Submit Publication Request',
  render: <SubmitPublicationRequest callbackUrl={callbackUrl} />,
  initialValues: {
    reviewInfo: false,
    reviewRelatedPublications: false,
  },
  validationSchema,
});
