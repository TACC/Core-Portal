import React, { useState } from 'react';
import { Button } from '_common';

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
        <Button>Button</Button>
      </dd>
      <dt>Primary Button</dt>
      <dd>
        <Button type="primary">Button</Button>
        <Button type="primary" disabled={true}>
          Disabled
        </Button>
      </dd>
      <dt>Secondary Button</dt>
      <dd>
        <Button type="secondary">Button</Button>
        <Button type="secondary" disabled={true}>
          Disabled
        </Button>
      </dd>
      <dt>Button Sizes</dt>
      <dd>
        <Button size="small">s</Button>
        <Button size="short">short</Button>
        <Button size="medium">medium</Button>
        <Button size="large">large</Button>
      </dd>
      <dt>Button with Icon</dt>
      <dd>
        <Button iconNameBefore="trash">Button</Button>
        <Button iconNameAfter="trash">Button</Button>
      </dd>
      <dt>Button as Link</dt>
      <dd>
        <Button type="link">Link</Button>
      </dd>
      <dt>Spinner over Button</dt>
      <dd>
        <Button
          type="primary"
          onClick={onClick}
          size="large"
          isLoading={isLoading}
        >
          Click Me!
        </Button>
      </dd>
    </dl>
  );
}

export default UIPatternsButton;
