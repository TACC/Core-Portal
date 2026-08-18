import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Input } from 'reactstrap';
import { useFormikContext } from 'formik';
import { SectionTableWrapper, Section, Button } from '_common';
import * as Yup from 'yup';
import styles from '../PublicationWizard.module.scss';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

const DEFAULT_AGREEMENTS = [
  {
    name: 'reviewInfo',
    label: 'I have reviewed the information and confirm that it is correct.',
  },
  {
    name: 'reviewRelatedPublications',
    label:
      'I have reviewed related publications/ I do not have any related publications.',
  },
];

const buildSchema = (agreements) =>
  Yup.object(
    agreements.reduce((schema, { name }) => {
      schema[name] = Yup.boolean().oneOf([true], 'Must be checked');
      return schema;
    }, {})
  );

// Final publish step: portal-defined consent checkboxes + submit
const SubmitPublicationRequest = ({ callbackUrl, agreements, contact }) => {
  const { handleChange, handleBlur, values, submitForm, resetForm, setValues } =
    useFormikContext();
  const history = useHistory();

  const [submitDisabled, setSubmitDisabled] = useState(true);

  const { loading, error, result } = useSelector((state) => {
    if (
      state.projects.operation &&
      state.projects.operation.name === 'publicationRequest'
    ) {
      return state.projects.operation;
    }
    return { loading: false, error: false };
  });

  useEffect(() => {
    if (result && !error && !loading) {
      setSubmitDisabled(false);
      resetForm();
      history.replace(callbackUrl);
    }
  }, [result, error, loading]);

  useEffect(() => {
    buildSchema(agreements)
      .isValid(values)
      .then((valid) => setSubmitDisabled(!valid));
  }, [values, agreements]);

  const onSubmit = () => {
    setValues({ ...values, formSubmitted: true });
    submitForm();
  };

  return (
    <SectionTableWrapper
      header={<div className={styles.title}>Submit Publication Request</div>}
    >
      {agreements.map(({ name, label }) => (
        <FormGroup check key={name}>
          <Input
            id={name}
            name={name}
            type="checkbox"
            value={values[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            checked={values[name]}
          />
          <span>
            {' '}
            {label}
            <span className={styles['required-text']}>*</span>
          </span>
        </FormGroup>
      ))}
      <Section contentLayoutName={'oneColumn'}>
        {contact && <div>{contact}</div>}
        <div className={styles['submit-div']}>
          <Button
            type="primary"
            className={styles['submit-button']}
            disabled={submitDisabled}
            isLoading={loading}
            onClick={onSubmit}
          >
            Submit Publication Request
          </Button>
        </div>
      </Section>
    </SectionTableWrapper>
  );
};

SubmitPublicationRequest.propTypes = {
  callbackUrl: PropTypes.string,
  agreements: PropTypes.array,
  contact: PropTypes.node,
};

export const SubmitPublicationRequestStep = ({
  callbackUrl,
  agreements = DEFAULT_AGREEMENTS,
  contact,
}) => ({
  id: 'submit_publication_request',
  name: 'Submit Publication Request',
  render: (
    <SubmitPublicationRequest
      callbackUrl={callbackUrl}
      agreements={agreements}
      contact={contact}
    />
  ),
  initialValues: {
    ...agreements.reduce((values, { name }) => {
      values[name] = false;
      return values;
    }, {}),
    formSubmitted: false,
  },
  validationSchema: buildSchema(agreements),
});

export default SubmitPublicationRequest;
