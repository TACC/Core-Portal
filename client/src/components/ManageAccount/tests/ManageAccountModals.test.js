import React from 'react';
import { render } from '@testing-library/react';
import { IntegrationModal } from '../ManageAccountModals';

describe('connect google drive', () => {
  it('should render privacy policy and link', () => {
    const { getByText } = render(
      <IntegrationModal
        active={true}
        toggle={() => {}}
        connect={'/accounts/applications/googledrive/initialize/'}
        label={'Google Drive'}
      />
    );
    expect(getByText(/Google Drive Privacy Policy/)).toBeDefined();
    expect(
      getByText(/Agree and Connect to Google Drive/)
        .closest('a')
        .getAttribute('href')
    ).toBe('/accounts/applications/googledrive/initialize/');
  });
});
