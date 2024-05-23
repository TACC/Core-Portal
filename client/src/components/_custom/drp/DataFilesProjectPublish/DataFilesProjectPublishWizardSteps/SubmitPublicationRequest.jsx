import React, { useEffect, useState } from 'react';
import { Button, FormGroup, Input } from 'reactstrap';
import { useFormikContext } from 'formik';
import { SectionTableWrapper, Section } from '_common';
import * as Yup from 'yup';
import styles from './DataFilesProjectPublishWizard.module.scss';

const validationSchema = Yup.object({
  reviewInfo: Yup.boolean().oneOf([true], 'Must be checked'),
  reviewRelatedPublications: Yup.boolean().oneOf([true], 'Must be checked'),
});

const SubmitPublicationRequest = () => {
  const { handleChange, handleBlur, values } = useFormikContext();

  const [submitDisabled, setSubmitDisabled] = useState(true);

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
          <Button type="submit" color="primary" disabled={submitDisabled}>
            Submit Publication Request
          </Button>
        </div>
      </Section>
    </SectionTableWrapper>
  );
};

export const SubmitPublicationRequestStep = () => ({
  id: 'submit_publication_request',
  name: 'Submit Publication Request',
  render: <SubmitPublicationRequest />,
  initialValues: {
    reviewInfo: false,
    reviewRelatedPublications: false,
  },
  validationSchema,
});
