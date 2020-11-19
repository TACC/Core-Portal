import React from 'react';
import { Message } from '_common';

import './UIPatternsMessage.module.scss';

const EXAMPLE_LINK_SHORT = (
  <a href="#" className="wb-link">
    Example link
  </a>
);
const EXAMPLE_LINK_LONG = (
  <a href="#" className="wb-link">
    Example link can be a complete sentence.
  </a>
);

const NOTIFICATION_TEXT = (
  <em>
    Can not render in isolation. See{' '}
    <a
      href="https://xd.adobe.com/view/db2660cc-1011-4f26-5d31-019ce87c1fe8-ad17/screen/3821fc3e-bda1-40d4-9e50-a514e90aa088/"
      target="_blank"
      rel="noreferrer"
    >
      Adobe Design.
    </a>
  </em>
);

function UIPatternsMessages() {
  return (
    <table styleName="container">
      <thead>
        <tr>
          <th scope="row" styleName="secondary">
            component
          </th>
          <th scope="col" colSpan="2">
            <code>&lt;Message&gt;</code>
          </th>
          <th scope="col">
            <code>&lt;NotifcationToast&gt;</code>
          </th>
        </tr>
        <tr>
          <th scope="row" styleName="secondary">
            <code>scope</code>
          </th>
          <th scope="col">
            <code>inline</code>
          </th>
          <th scope="col">
            <code>section</code>
          </th>
          <th scope="col">
            <code>app</code>
          </th>
        </tr>
        <tr>
          <th scope="col" styleName="secondary">
            <code>type</code>
          </th>
          <td>
            Example
            <ul>
              <li>action result statement in table row</li>
              <li>(?) message when table can not load data</li>
            </ul>
          </td>
          <td>
            Example
            <ul>
              <li>warning at the top of a form</li>
              <li>message after successful submission of form</li>
              <li>(?) message when table can not load data</li>
            </ul>
          </td>
          <td>
            Example
            <ul>
              <li>user action is required</li>
              <li>important user-initiated action is completed</li>
              <li>security concern</li>
              <li>milestone for time-sensitive activity</li>
            </ul>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">
            <code>info</code>
          </th>
          <td>
            <Message type="info" scope="inline">
              All your information, are belong to us. {EXAMPLE_LINK_SHORT}
            </Message>
          </td>
          <td>
            <Message type="info" scope="section">
              All your information, are belong to us. {EXAMPLE_LINK_SHORT}
            </Message>
            <Message type="info" scope="section" canDismiss>
              You exist. {EXAMPLE_LINK_LONG}
            </Message>
          </td>
          <td rowSpan="2">{NOTIFICATION_TEXT}</td>
        </tr>
        <tr>
          <th scope="row">
            <code>success</code>
          </th>
          <td>
            <Message type="success" scope="inline">
              All your success, are belong to us. {EXAMPLE_LINK_SHORT}
            </Message>
          </td>
          <td>
            <Message type="success" scope="section">
              All your success, are belong to us. {EXAMPLE_LINK_SHORT}
            </Message>
            <Message type="success" scope="section" canDismiss>
              We did well. {EXAMPLE_LINK_LONG}
            </Message>
          </td>
          {/* <td /> */}
        </tr>
        <tr>
          <th scope="row">
            <code>warn</code>
          </th>
          <td>
            <Message type="warn" scope="inline">
              All your warning, are come from us. {EXAMPLE_LINK_SHORT}
            </Message>
          </td>
          <td>
            <Message type="warn" scope="section">
              All your warning, are come from us. {EXAMPLE_LINK_SHORT}
            </Message>
            <Message type="warn" scope="section" canDismiss>
              You did poorly. {EXAMPLE_LINK_LONG}
            </Message>
          </td>
          <td rowSpan="2" styleName="is-row-end">
            {NOTIFICATION_TEXT}
          </td>
        </tr>
        <tr>
          <th scope="row">
            <code>error</code>
          </th>
          <td>
            <Message type="error" scope="inline">
              All your error, are belong to you. {EXAMPLE_LINK_SHORT}
            </Message>
          </td>
          <td>
            <Message type="error" scope="section">
              All your error, are belong to you. {EXAMPLE_LINK_SHORT}
            </Message>
            <Message type="error" scope="section" canDismiss>
              You failed. {EXAMPLE_LINK_LONG}
            </Message>
          </td>
          {/* <td /> */}
        </tr>
      </tbody>
    </table>
  );
}

export default UIPatternsMessages;
