import React from 'react';
import { render } from '@testing-library/react';
import DescriptionList, { LAYOUTS } from './DescriptionList';

const DATA = {
  Username: 'bobward500',
  Prefix: 'Mr.',
  Name: 'Bob Ward',
  Suffix: 'The 5th'
};

describe('Description List', () => {
  it.each(LAYOUTS)('has accurate tags when layout is "%s"', async layout => {
    const { getByTestId, findAllByTestId } = render(<DescriptionList data={DATA} layout={layout} />);
    const root = getByTestId('list');
    const keys = await findAllByTestId('key');
    const values = await findAllByTestId('value');
    expect(root).toBeDefined();
    expect(root.tagName).toEqual('DL');
    keys.forEach( key => {
      expect(key.tagName).toEqual('DT');
    });
    values.forEach( value => {
      expect(value.tagName).toEqual('DD');
    });
  });
});
