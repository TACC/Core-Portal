import React from 'react';
import { useField } from 'formik';
import { FormGroup, FormText, Label } from 'reactstrap';
import PropTypes from 'prop-types';
import FileInputDropZone from './FileInputDropZone';
import './FormField.scss';

function FileInputDropZoneFormField({ id, isSubmitted, description }) {
  // eslint-disable-next-line no-unused-vars
  const [field, meta, helpers] = useField(id);

  return (
    <FormGroup>
      <Label
        for={id}
        size="sm"
        className="form-field__label"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        Upload Files
      </Label>
      <FileInputDropZone
        id={id}
        files={field.value}
        onSetFiles={helpers.setValue}
        isSubmitted={isSubmitted}
      />
      <FormText className="form-field__help" color="muted">
        {description}
      </FormText>
    </FormGroup>
  );
}

FileInputDropZoneFormField.propTypes = {
  id: PropTypes.string.isRequired,
  isSubmitted: PropTypes.bool.isRequired,
  description: PropTypes.string
};

FileInputDropZoneFormField.defaultProps = {
  description: undefined
};

export default FileInputDropZoneFormField;
