import React from 'react';
import { Message } from '_common';

const EXAMPLE_LINK = (
  <a href="#" className="wb-link">
    Read more.
  </a>
);

function UIPatternsMessages() {
  return (
    <dl>
      <dt>
        Information (<code>info</code>)
      </dt>
      <dd>
        <Message type="info">
          All your information, are belong to us. {EXAMPLE_LINK}
        </Message>
      </dd>
      <dt>
        Success (<code>success</code>)
      </dt>
      <dd>
        <Message type="success">
          All your success, are belong to us. {EXAMPLE_LINK}
        </Message>
      </dd>
      <dt>
        Warning (<code>warn</code>)
      </dt>
      <dd>
        <Message type="warn">
          All your warning, are come from us. {EXAMPLE_LINK}
        </Message>
      </dd>
      <dt>
        Error (<code>error</code>)
      </dt>
      <dd>
        <Message type="error">
          All your error, are belong to you. {EXAMPLE_LINK}
        </Message>
      </dd>
    </dl>
  );
}

export default UIPatternsMessages;
