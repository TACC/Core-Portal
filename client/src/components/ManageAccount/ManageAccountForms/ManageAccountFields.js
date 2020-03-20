import React from 'react';
import { useField } from 'formik';
import { string } from 'prop-types';
import { useSelector } from 'react-redux';
import { FormText, Input, FormGroup, Label } from 'reactstrap';

export const renderOptions = ([value, label], arr, _) => (
  <option key={label} {...{ value, label }} />
);

export const useOptions = label => {
  switch (label) {
    case 'Institution':
      return 'institutions';
    case 'Position/Title':
      return 'titles';
    case 'Ethnicity':
      return 'ethnicities';
    case 'Gender':
      return 'genders';
    case 'Citizenship':
      return 'countries';
    case 'Professional Level':
      return 'professionalLevels';
    default:
      return 'countries';
  }
};

export const ManageAccountInput = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  const { type } = props;
  const select = type === 'select';
  let key, options;
  if (select) {
    key = useOptions(label);
    options = useSelector(state => state.profile.fields[key]);
  }
  return (
    <FormGroup>
      <Label>{label}</Label>
      {select ? (
        <Input
          {...field}
          {...props}
          bsSize="sm"
          disabled={label === 'Citizenship' && field.value}
        >
          {options.map(renderOptions)}
        </Input>
      ) : (
        <Input
          {...field}
          {...props}
          className={`${meta.error ? 'is-invalid' : ''}`}
          bsSize="sm"
        />
      )}
      {meta.touched && meta.error ? (
        <FormText color="danger">{meta.error}</FormText>
      ) : null}
    </FormGroup>
  );
};
ManageAccountInput.propTypes = { label: string.isRequired, type: string };
ManageAccountInput.defaultProps = { type: 'text' };
