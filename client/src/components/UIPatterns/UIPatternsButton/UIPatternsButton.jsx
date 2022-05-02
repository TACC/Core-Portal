import React, { useState } from 'react';
import { Button, InlineMessage } from '_common';

import './UIPatternsButton.module.css';

function UIPatternsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const onClick = (e) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };
  return (
    <dl>
      <dt>Default Button</dt>
      <dd>
        <small>
          (auto-set:&nbsp;
          <code>type=&quot;secondary&quot;</code>&nbsp;
          <code>size=&quot;short&quot;</code>)
        </small>
      </dd>
      <dd>
        <Button>Button</Button>
        <Button disabled={true}>Disabled</Button>
      </dd>
      <dt>Primary Button</dt>
      <dd>
        <small>
          <code>type=&quot;primary&quot;</code>
        </small>
      </dd>
      <dd>
        <Button type="primary">Button</Button>
        <Button type="primary" disabled={true}>
          Disabled
        </Button>
        <InlineMessage type="info">No small primary buttons.</InlineMessage>
        <p>
          <small>
            Use for regular-height buttons that are alone or are the main action
            of a pair of buttons.
          </small>
        </p>
      </dd>
      <dt>Secondary Button</dt>
      <dd>
        <small>
          <code>type=&quot;secondary&quot;</code>&nbsp; (
          <code>size=&quot;small&quot;</code>)
        </small>
      </dd>
      <dd>
        <Button type="secondary">Button</Button>
        <Button type="secondary" disabled={true}>
          Disabled
        </Button>
        <Button type="secondary" size="small">
          Button
        </Button>
        <p>
          <small>
            Use for buttons in groups, in headers, and all small buttons.
          </small>
        </p>
      </dd>
      <dt>Button Sizes: Heights</dt>
      <dd>
        <small>
          <code>size=&quot;small&quot;</code>
        </small>
      </dd>
      <dd>
        <Button size="small">small</Button>
        <Button size="small">small, more text</Button>
        <Button size="small">small, even more text</Button>
        <p>
          <small>
            Small buttons are as wide as their content but do not exceed width
            of <code>size=&quot;medium&quot;</code>.
          </small>
        </p>
      </dd>
      <dt>Button Sizes: Widths</dt>
      <dd>
        <small>
          <code>size=&quot;short&quot;</code>
          &nbsp;|&nbsp;
          <code>size=&quot;medium&quot;</code>
          &nbsp;|&nbsp;
          <code>size=&quot;long&quot;</code>
        </small>
      </dd>
      <dd>
        <Button size="short">short</Button>
        <Button size="medium">medium</Button>
        <Button size="long">long</Button>
      </dd>
      <dd>
        <Button size="short">short, with more text</Button>
        <Button size="medium">medium, with more text</Button>
        <Button size="long">long, with more text</Button>
        <p>
          <small>
            All regular-height buttons are limited to these available widths.
          </small>
        </p>
      </dd>
      <dt>Button with Icon</dt>
      <dd>
        <small>
          <code>iconNameBefore=&quot;...&quot;</code>
          &nbsp;|&nbsp;
          <code>iconNameBefore=&quot;...&quot;</code>
          &nbsp;(manually added: <code>size=&quot;medium&quot;</code>)
        </small>
      </dd>
      <dd>
        <Button iconNameBefore="trash" size="medium">
          Button
        </Button>
        <Button iconNameAfter="trash" size="medium">
          Button
        </Button>
      </dd>
      <dt>Button as Link</dt>
      <dd>
        <small>
          <code>type=&quot;link&quot;</code>
        </small>
      </dd>
      <dd>
        <Button type="link">Link</Button>
        <p>
          <small>To “clear” or “cancel” a UI state.</small>
        </p>
      </dd>
      <dt>Spinner over Button</dt>
      <dd>
        <small>
          <code>isLoading=&quot;...&quot;</code>&nbsp;
          <code>type=&quot;...&quot;</code>&nbsp;
          <code>size=&quot;...&quot;</code>
        </small>
      </dd>
      <dd>
        <Button
          type="primary"
          onClick={onClick}
          size="long"
          isLoading={isLoading}
        >
          Click Me!
        </Button>
      </dd>
    </dl>
  );
}

export default UIPatternsButton;
