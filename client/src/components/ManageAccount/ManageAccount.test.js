import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { initialState as profile} from '../../redux/reducers/profile.reducers'
import { initialState as workbench} from '../../redux/reducers/workbench.reducers'
import ManageAccountPage from './index';

describe('Manage Account Page', () => {
  const mockStore = configureStore();
  const Wrapper = ({ children }) => (
    <Provider store={mockStore({ profile, workbench })}>
      <BrowserRouter>{children}</BrowserRouter>
    </Provider>
  );
  it('should tell the user what page they\'re viewing', () => {
    const { getByText } = render(<Wrapper><ManageAccountPage /></Wrapper>);
    expect(getByText(/Manage Account/)).toBeDefined();
  });
})
