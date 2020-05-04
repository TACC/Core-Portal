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

export const ManageAccountInput = ({ label, type, ...props }) => {
  const [field, meta, { setValue }] = useField(props);
  const [other, setOther] = React.useState(false);
  const select = type === 'select';
  const key = select ? useOptions(label) : '';
  const options = useSelector(state => {
    if (key) return state.profile.fields[key];
    return [];
  });

  React.useEffect(() => {
    const initialValues = options.map(option => option[0]);
    if (meta.value === 'Other' || !initialValues.includes(meta.value)) {
      setOther(true);
    }
  }, []);

  if (select && label === 'Professional Level') {
    return (
      <FormGroup>
        <Label>{label}</Label>
        {other ? (
          <>
            <Input {...field} {...props} type="text" />
            <Input
              type="select"
              onChange={({ target }) => {
                if (!target.value.includes('Other')) {
                  setOther(false);
                  setValue(target.value);
                }
              }}
            >
              {options.map(([value, lbl], arr, _) => {
                return (
                  <option
                    key={lbl}
                    {...{ value, label: lbl }}
                    selected={lbl.includes('Other')}
                  />
                );
              })}
            </Input>
          </>
        ) : (
          <Input
            {...field}
            {...props}
            onChange={({ target }) => {
              if (target.value === 'Other') {
                setOther(true);
              } else {
                setValue(target.value);
              }
            }}
            bsSize="sm"
            disabled={label === 'Citizenship' && field.value}
          >
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
          className={meta.error && 'is-invalid'}
          bsSize="sm"
        />
      )}
      {meta.error && <FormText color="danger">{meta.error}</FormText>}
    </FormGroup>
  );
};
ManageAccountInput.propTypes = { label: string.isRequired, type: string };
ManageAccountInput.defaultProps = { type: 'text' };
