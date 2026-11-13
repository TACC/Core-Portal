import React from 'react';
import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import configureStore from 'redux-mock-store';
import renderComponent from 'utils/testing';
import { ProjectDescriptionStep } from './ProjectDescription';

const mockStore = configureStore();

const project = {
  title: 'Dataset',
  description: 'A description',
  created: '2026-01-01T00:00:00Z',
};

const requireLicense = (values) =>
  values.license ? {} : { license: 'License is required' };

const renderStep = (stepProject) => {
  const step = ProjectDescriptionStep({
    project: stepProject,
    validate: requireLicense,
  });
  const store = mockStore({ projects: { metadata: { members: [] } } });
  return renderComponent(
    <Formik
      initialValues={step.initialValues}
      validate={step.validate}
      validateOnMount
      onSubmit={() => {}}
    >
      {step.render}
    </Formik>,
    store
  );
};

describe('ProjectDescription', () => {
  it('lists a missing license as an error and shows the license as None', async () => {
    renderStep(project);

    expect(await screen.findByText('License is required')).toBeInTheDocument();
    expect(
      screen.getByText('Dataset metadata has the following errors:')
    ).toBeInTheDocument();
    expect(
      screen.getByText('License', { selector: 'dt' }).nextElementSibling
    ).toHaveTextContent('None');
  });

  it('shows the license and no errors when one is set', async () => {
    renderStep({ ...project, license: 'ODC-BY 1.0' });

    expect(await screen.findByText('ODC-BY 1.0')).toBeInTheDocument();
    expect(
      screen.queryByText('Dataset metadata has the following errors:')
    ).not.toBeInTheDocument();
  });
});
