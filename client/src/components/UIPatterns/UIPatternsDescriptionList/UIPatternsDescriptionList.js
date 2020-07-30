import React from 'react';
import { DescriptionList, Icon } from '_common';

const DATA = {
  Username: 'bobward500',
  Prefix: 'Mr.',
  Name: 'Bob Ward',
  Suffix: 'The 5th',
  'Favorite Numeric Value': 5,
  Icon: <Icon name="dashboard" />
};

function UIPatternsDropdownSelector() {
  return (
    <dl>
      <dt>
        Default Layout (<code>block</code>)
      </dt>
      <dd>
        <DescriptionList data={DATA} />
      </dd>
      <dt>
        Inline Layout (<code>inline</code>)
      </dt>
      <dd>
        <DescriptionList data={DATA} layout="inline" />
      </dd>
    </dl>
  );
}

export default UIPatternsDropdownSelector;
