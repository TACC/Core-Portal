import React from 'react';
import { Message } from '_common';

function UIPatternsMessages() {
  return (
    <dl>
      <dt>
        Information (<code>info</code>)
      </dt>
      <dd>
        <Message type="info">All your information, are belong to us.</Message>
      </dd>
      <dt>
        Success (<code>success</code>)
      </dt>
      <dd>
        <Message type="success">All your success, are belong to us.</Message>
      </dd>
      <dt>
        Warning (<code>warn</code>)
      </dt>
      <dd>
        <Message type="warn">All your warning, are come from us.</Message>
      </dd>
      <dt>
        Error (<code>error</code>)
      </dt>
      <dd>
        <Message type="error">All your error, are belong to you.</Message>
      </dd>
    </dl>
  );
}

export default UIPatternsMessages;
