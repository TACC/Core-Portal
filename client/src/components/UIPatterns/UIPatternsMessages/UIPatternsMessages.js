import React from 'react';
import { Message } from '_common';

function UIPatternsMessages() {
  return (
    <dl styleName="container">
      <dt>
        Information (<code>info</code>)
      </dt>
      <dd>
        <Message type="info" styleName="item">
          All your information, are belong to us.
        </Message>
      </dd>
      <dt>
        Success (<code>success</code>)
      </dt>
      <dd>
        <Message type="success" styleName="item">
          All your success, are belong to us.
        </Message>
      </dd>
      <dt>
        Warning (<code>warn</code>)
      </dt>
      <dd>
        <Message type="warn" styleName="item">
          All your warning, are come from us.
        </Message>
      </dd>
      <dt>
        Error (<code>error</code>)
      </dt>
      <dd>
        <Message type="error" styleName="item">
          All your error, are belong to you.
        </Message>
      </dd>
    </dl>
  );
}

export default UIPatternsMessages;
