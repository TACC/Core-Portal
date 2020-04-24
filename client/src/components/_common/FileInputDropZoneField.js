import React from 'react';
import { useField } from 'formik';
import { FormGroup, FormText, Label } from 'reactstrap';
import PropTypes from 'prop-types';
import FileInputDropZone from './FileInputDropZone';

function FileInputDropZoneField({ id, isSubmitted, description }) {
  // eslint-disable-next-line no-unused-vars
  const [field, meta, helpers] = useField(id);

  return (
    <FormGroup className="appForm-textInput" /* TODO fix classname */>
      <Label
        for={id}
        size="sm"
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
      <FormText className="appForm-help" color="muted" /* TODO fix classname */>
        {description}
      </FormText>
    </FormGroup>
  );
}

FileInputDropZoneField.propTypes = {
  id: PropTypes.string.isRequired,
  isSubmitted: PropTypes.bool.isRequired,
  description: PropTypes.string
};

FileInputDropZoneField.defaultProps = {
  description: undefined
};

export default FileInputDropZoneField;
