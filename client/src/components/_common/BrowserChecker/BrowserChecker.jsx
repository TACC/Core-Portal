import React from 'react';
import { parse } from 'bowser';
import { UncontrolledAlert } from 'reactstrap';

const BrowserChecker = () => {
  const { browser } = parse(navigator.userAgent);
  const unsupported = ![
    'Chrome',
    'Firefox',
    'Safari',
    'Microsoft Edge'
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
