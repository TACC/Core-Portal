import React, { useState } from 'react';
import {
  FormGroup,
  Label,
  Input,
  FormText,
  Badge,
  InputGroup,
} from 'reactstrap';
import { Button } from '_common';

import { useField } from 'formik';
import PropTypes from 'prop-types';
import './FormField.scss';

/** A limited-choice wrapper for `FormField` */
const FormFieldWrapper = ({ children, type }) => {
  let wrapper;

  switch (type) {
    case 'InputGroup':
      wrapper = <InputGroup>{children}</InputGroup>;
      break;

    case 'FormGroup':
    default:
      wrapper = <FormGroup>{children}</FormGroup>;
  }

  return wrapper;
};
FormFieldWrapper.propTypes = {
  /** The content for the wrapper */
  children: PropTypes.node.isRequired,
  /** Which wrapper to use */
  type: PropTypes.oneOf(['InputGroup', 'FormGroup', '']),
};
FormFieldWrapper.defaultProps = {
  type: 'FormGroup',
};

/**
 * A standard form field that supports some customization and presets.
 *
 * Customizations:
 * - providing an `<InputGroupAddon>` (can not use with "Tapis File Selector")
 *
 * Presets:
 * - Tapis File Selector (requires `tapisFile` and `SelectModal`)
 */
const FormField = ({
  addon,
  addonType,
  label,
  description,
  required,
  tapisFile,
  SelectModal,
  ...props
}) => {
  // useField() returns [formik.getFieldProps(), formik.getFieldMeta()]
  // which we can spread on <input> and also replace ErrorMessage entirely.
  const [field, meta, helpers] = useField(props);
  const [openTapisFileModal, setOpenTapisFileModal] = useState(false);
  const { id, name, parameterSet } = props;
  const hasAddon = addon !== undefined;
  const wrapperType = hasAddon ? 'InputGroup' : '';

  const FieldLabel = () => (
    <Label
      className="form-field__label"
      for={id || name}
      size="sm"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {label}&nbsp;
      {parameterSet && (
        <code>
          (
          <a
            href={`https://tapis.readthedocs.io/en/latest/technical/jobs.html#${parameterSet.toLowerCase()}`}
            target="_blank"
            rel="noreferrer"
          >
            {parameterSet}
          </a>
          )
        </code>
      )}
      {required ? (
        <Badge
          color={null}
          className="badge badge-danger"
          style={{ marginLeft: '10px' }}
        >
          Required
        </Badge>
      ) : null}
    </Label>
  );
  const FieldNote = () => (
    <>
      <FormText className="form-field__help" color="muted">
        {description}
        {meta.touched && meta.error && (
          <div className="form-field__validation-error">{meta.error}</div>
        )}
      </FormText>
    </>
  );

  // Allowing ineffectual prop combinations would lead to confusion
  if (addon && tapisFile) {
    throw new Error(
      'You must not pass `addon` and `tapisFile`, because `tapisFile` triggers its own field add-on'
    );
  }
  if ((!tapisFile && SelectModal) || (tapisFile && !SelectModal)) {
    throw new Error('A `tapisFile` and a `SelectModal` must both be passed');
  }

  return (
    <>
      {label && hasAddon ? <FieldLabel /> : null}
      <FormFieldWrapper type={wrapperType}>
        {label && !hasAddon ? <FieldLabel /> : null}
        {tapisFile ? (
          <>
            <SelectModal
              isOpen={openTapisFileModal}
              toggle={() => {
                setOpenTapisFileModal((prevState) => !prevState);
              }}
              onSelect={(system, path) => {
                helpers.setValue(`tapis://${system}/${path}`);
              }}
            />

            <InputGroup>
              <Button
                type="secondary"
                onClick={() => setOpenTapisFileModal(true)}
              >
                Select
              </Button>
              <Input {...field} {...props} bsSize="sm" />
            </InputGroup>
          </>
        ) : (
          <>
            {hasAddon && addonType === 'prepend' ? addon : null}
            <Input {...field} {...props} bsSize="sm" />
            {hasAddon && addonType === 'append' ? addon : null}
          </>
        )}
        {!hasAddon ? <FieldNote /> : null}
      </FormFieldWrapper>
      {hasAddon ? <FieldNote /> : null}
    </>
  );
};
FormField.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  required: PropTypes.bool,
  tapisFile: PropTypes.bool,
  SelectModal: PropTypes.func,
  /** An [`<InputGroupAddon>`](https://reactstrap.github.io/components/input-group/) to add */
  addon: PropTypes.node,
  /** The [`<InputGroupAddon>` `addonType`](https://reactstrap.github.io/components/input-group/) to add */
  addonType: PropTypes.oneOf(['prepend', 'append']),
};
FormField.defaultProps = {
  id: undefined,
  name: undefined,
  label: undefined,
  description: undefined,
  required: false,
  tapisFile: undefined,
  SelectModal: undefined,
  addon: undefined,
  addonType: undefined,
};

export default FormField;
