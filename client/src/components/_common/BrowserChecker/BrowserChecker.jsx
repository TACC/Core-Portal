import React from 'react';
import Bowser from 'bowser';
import { UncontrolledAlert } from 'reactstrap';

const BrowserChecker = () => {
  const { browser } = Bowser.parse(navigator.userAgent);
  const unsupported = ![
    'Chrome',
    'Firefox',
    'Safari',
    'Microsoft Edge',
  ].includes(browser.name);

  return (
    unsupported && (
      <UncontrolledAlert color="warning">
        Your browser is not supported. Switch to Chrome, Firefox, Safari, or
        Edge.
      </UncontrolledAlert>
    )
  );
};

export default BrowserChecker;
