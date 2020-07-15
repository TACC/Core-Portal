import React from 'react';
import { Message } from '_common';
import './UIPatternsMessages.module.css';

function UIPatternsMessages() {
  return (
    <div styleName="container">
      <Message type="info" styleName="item">
        All your information, are belong to us.
      </Message>
      <Message type="success" styleName="item">
        All your success, are belong to us.
      </Message>
      <Message type="warn" styleName="item">
        All your warning, are come from us.
      </Message>
      <Message type="error" styleName="item">
        All your error, are belong to you.
      </Message>
    </div>
  );
}

export default UIPatternsMessages;
