import React, { useState } from 'react';
import {
  Button,
  FormGroup,
  Label,
  Input,
  FormText,
  Badge,
  InputGroup,
  InputGroupAddon
} from 'reactstrap';

import { useField } from 'formik';
import PropTypes from 'prop-types';
import DataFilesSelectModal from '../../DataFiles/DataFilesModals/DataFilesSelectModal';
import './FormField.scss';

const FormField = ({ label, description, required, agaveFile, ...props }) => {
  // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
  // which we can spread on <input> and also replace ErrorMessage entirely.
  const [field, meta, helpers] = useField(props);
  const [openAgaveFileModal, setOpenAgaveFileModal] = useState(false);
  const { id, name } = props;

  return (
    <FormGroup>
      <Label
        className="form-field__label"
        for={id || name}
        size="sm"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        {label}{' '}
        {required ? (
          <Badge color="danger" style={{ marginLeft: '10px' }}>
            Required
          </Badge>
        ) : null}
      </Label>
      {agaveFile ? (
        <div>
          <DataFilesSelectModal
            isOpen={openAgaveFileModal}
            toggle={() => {
              setOpenAgaveFileModal(prevState => !prevState);
            }}
            onSelect={(system, path) => {
              helpers.setValue(`agave://${system}${path}`);
            }}
          />

          <InputGroup>
            <InputGroupAddon addonType="prepend">
              <Button
                size="sm"
                color="secondary"
                type="button"
                onClick={() => setOpenAgaveFileModal(true)}
              >
                Select
              </Button>
            </InputGroupAddon>
            <Input {...field} {...props} bsSize="sm" />
          </InputGroup>
        </div>
      ) : (
        <Input {...field} {...props} bsSize="sm" />
      )}
      {meta.touched && meta.error ? (
        <div className="form-field__validation-error">{meta.error}</div>
      ) : (
        <FormText className="form-field__help" color="muted">
          {description}
        </FormText>
      )}
    </FormGroup>
  );
};
FormField.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  required: PropTypes.bool,
  agaveFile: PropTypes.bool
};
FormField.defaultProps = {
  id: undefined,
  name: undefined,
  label: undefined,
  description: undefined,
  required: false,
  agaveFile: undefined
};

export default FormField;
