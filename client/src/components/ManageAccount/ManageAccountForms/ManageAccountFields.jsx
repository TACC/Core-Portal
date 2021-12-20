import React from 'react';
import { useField } from 'formik';
import { string } from 'prop-types';
import { useSelector } from 'react-redux';
import { FormText, Input, FormGroup, Label } from 'reactstrap';

export const renderOptions = ([value, label], arr, _) => (
  <option key={label} value={value}>
    {label}
  </option>
);

export const useOptions = (label) => {
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
  const [field, meta, { setValue }] = useField(props);
  const [other, setOther] = React.useState(false);
  const { type } = props;

  const select = type === 'select';
  const key = select ? useOptions(label) : '';
  const options = useSelector((state) => {
    if (key) return state.profile.fields[key];
    return [];
  });

  const inputProps = { ...field, ...props };
  if (other) {
    inputProps.style = { marginTop: '0.5rem' };
  }
  React.useEffect(() => {
    const initialValues = options.map((option) => option[0]);
    if (meta.value === 'Other' || !initialValues.includes(meta.value)) {
      setOther(true);
    }
  }, []);

  if (select && label === 'Professional Level') {
    const handleOtherChange = (e) => {
      if (!e.target.value.includes('Other')) {
        setOther(false);
        setValue(e.target.value);
      }
    };
    const handleChange = (e) => {
      if (e.target.value === 'Other') {
        setOther(true);
        setValue('');
      } else {
        setValue(e.target.value);
      }
    };

    return (
      <FormGroup>
        <Label>{label}</Label>
        {other ? (
          <>
            <Input
              type="select"
              defaultValue="Other"
              bsSize="sm"
              onChange={handleOtherChange}
            >
              {options.map(renderOptions)}
            </Input>
            <Input {...inputProps} bsSize="sm" type="text" />
          </>
        ) : (
          <Input {...inputProps} onChange={handleChange} bsSize="sm">
            {options.map(renderOptions)}
          </Input>
        )}
      </FormGroup>
    );
  }
  return (
    <FormGroup>
      <Label>{label}</Label>
      {select ? (
        <Input {...inputProps} bsSize="sm">
          {options.map(renderOptions)}
        </Input>
      ) : (
        <Input
          {...inputProps}
          className={meta.error && 'is-invalid'}
          bsSize="sm"
        />
      )}
      {meta.error && <FormText color="danger">{meta.error}</FormText>}
    </FormGroup>
  );
};
ManageAccountInput.propTypes = {
  label: string.isRequired,
  name: string.isRequired,
  type: string,
};
ManageAccountInput.defaultProps = { type: 'text' };
