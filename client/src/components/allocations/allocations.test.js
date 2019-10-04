import React from 'react';
import ReactDOM from 'react-dom';
import Allocations from './index';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Allocations />, div);
  ReactDOM.unmountComponentAtNode(div);
});
