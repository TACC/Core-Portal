import React, { useState } from 'react';
import { Button, Icon } from '_common';

import styles from './UIPatternsButton.module.css';

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
      <dt>Default</dt>
      <dd><Button>Button</Button></dd>

      <dt>Types</dt>
      <dd>
        <table>
          <thead>
            <tr>
              <th></th>
              <th scope="col">Normal</th>
              <th scope="col">Disabled</th>
              <th scope="col">Small</th>
              <th scope="col"><span className="sr-only">Note</span></th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles['primary']}>
              <td>Primary</td>
              <td><Button type="primary">Button</Button></td>
              <td><Button type="primary" disabled>Button</Button></td>
              <td><Icon name="no-alert">not supported</Icon></td>
            </tr>
            <tr>
              <td>Secondary</td>
              <td><Button type="secondary">Button</Button></td>
              <td><Button type="secondary" disabled>Button</Button></td>
              <td><Button type="secondary" size="small">Button</Button></td>
            </tr>
            <tr className={styles['link']}>
              <td>as Link</td>
              <td><Button type="link">Button</Button></td>
              <td><Button type="link" disabled>Button</Button></td>
              <td><Button type="link">Button</Button></td>
              <td><small>A <code>&lt;Button type=&quot;link&quot;&gt;</code> ignores <code>size</code> prop.</small></td>
            </tr>
          </tbody>
        </table>
      </dd>

      <dt>Sizes</dt>
      <dd>
        <table>
          <thead>
            <tr>
              <th></th>
              <th scope="col">Small</th>
              <th scope="col">Short</th>
              <th scope="col">Medium</th>
              <th scope="col">Long</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Act</td>
              <td><Button size="small">Act</Button></td>
              <td><Button size="short">Act</Button></td>
              <td><Button size="medium">Act</Button></td>
              <td><Button size="long">Act</Button></td>
            </tr>
            <tr>
              <td>Action Text</td>
              <td><Button size="small">Action Text</Button></td>
              <td><Button size="short">Action Text</Button></td>
              <td><Button size="medium">Action Text</Button></td>
              <td><Button size="long">Action Text</Button></td>
            </tr>
            <tr>
              <td>Long Text is Truncated</td>
              <td><Button size="small">Long Text is Truncated</Button></td>
              <td><Button size="short">Long Text is Truncated</Button></td>
              <td><Button size="medium">Long Text is Truncated</Button></td>
              <td><Button size="long">Long Text is Truncated</Button></td>
            </tr>
          </tbody>
        </table>
      </dd>
      <dt>Spinner over Button</dt>
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
