import React from 'react';
import { Message } from '_common';

import './UIPatternsMessage.module.scss';

const EXAMPLE_LINK = {
  short: (
    <a href="#" className="wb-link">
      Example link
    </a>
  ),
  long: (
    <a href="#" className="wb-link">
      Example link can be a complete sentence.
    </a>
  )
};
const EXAMPLE_TEXT = {
  info: {
    short: 'You exist.',
    long: 'All your information, are belong to us.'
  },
  success: {
    short: 'We did well.',
    long: 'All your success, are belong to us.'
  },
  warn: {
    short: 'You did poorly.',
    long: 'All your warning, are come from us.'
  },
  error: {
    short: 'You failed.',
    long: 'All your error, are belong to you.'
  }
};

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
          <th scope="col">
            <code>&lt;Message&gt;</code>
          </th>
          <th scope="col">
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
            When to Use
            <ul>
              <li>action result statement in table row</li>
              <li>message when table can not load data</li>
            </ul>
          </td>
          <td>
            When to Use
            <ul>
              <li>warning at the top of a form</li>
              <li>message after successful submission of form</li>
            </ul>
          </td>
          <td>
            When to Use
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
              {EXAMPLE_TEXT.info.long} {EXAMPLE_LINK.short}
            </Message>
            <hr />
            <Message type="info" scope="inline">
              {EXAMPLE_TEXT.info.short} {EXAMPLE_LINK.long}
            </Message>
          </td>
          <td>
            <Message type="info" scope="section">
              {EXAMPLE_TEXT.info.long} {EXAMPLE_LINK.short}
            </Message>
            <Message type="info" scope="section" canDismiss>
              {EXAMPLE_TEXT.info.short} {EXAMPLE_LINK.long}
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
              {EXAMPLE_TEXT.success.long} {EXAMPLE_LINK.short}
            </Message>
            <hr />
            <Message type="success" scope="inline" canDismiss>
              {EXAMPLE_TEXT.success.short} {EXAMPLE_LINK.long}
            </Message>
          </td>
          <td>
            <Message type="success" scope="section">
              {EXAMPLE_TEXT.success.long} {EXAMPLE_LINK.short}
            </Message>
            <Message type="success" scope="section" canDismiss>
              {EXAMPLE_TEXT.success.short} {EXAMPLE_LINK.long}
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
              {EXAMPLE_TEXT.warn.long} {EXAMPLE_LINK.short}
            </Message>
            <hr />
            <Message type="warn" scope="inline">
              {EXAMPLE_TEXT.warn.short} {EXAMPLE_LINK.long}
            </Message>
          </td>
          <td>
            <Message type="warn" scope="section">
              {EXAMPLE_TEXT.warn.long} {EXAMPLE_LINK.short}
            </Message>
            <Message type="warn" scope="section" canDismiss>
              {EXAMPLE_TEXT.warn.short} {EXAMPLE_LINK.long}
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
              {EXAMPLE_TEXT.error.long} {EXAMPLE_LINK.short}
            </Message>
            <hr />
            <Message type="error" scope="inline">
              {EXAMPLE_TEXT.error.short} {EXAMPLE_LINK.long}
            </Message>
          </td>
          <td>
            <Message type="error" scope="section">
              {EXAMPLE_TEXT.error.long} {EXAMPLE_LINK.short}
            </Message>
            <Message type="error" scope="section" canDismiss>
              {EXAMPLE_TEXT.error.short} {EXAMPLE_LINK.long}
            </Message>
          </td>
          {/* <td /> */}
        </tr>
      </tbody>
    </table>
  );
}

export default UIPatternsMessages;
