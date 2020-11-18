import React from 'react';
import { render } from '@testing-library/react';
import Message, * as MSG from './Message';

const TEST_CONTENT = '…';
const TEST_TYPE = 'info';

function testClassnamesByType(type, getByRole, getByTestId) {
  const root = getByRole('status');
  const icon = getByRole('img'); // WARNING: Relies on `Icon`
  const text = getByTestId('text');
  const iconName = MSG.TYPE_MAP[type].iconName;
  const modifierClassName = MSG.TYPE_MAP[type].className;
  expect(root.className).toMatch('container');
  expect(root.className).toMatch(new RegExp(modifierClassName));
  expect(icon.className).toMatch(iconName);
  expect(text.className).toMatch('text');
}

describe('Message', () => {
  it.each(MSG.TYPES)('has correct text for type %s', type => {
    const { getByTestId } = render(
      <Message type={type}>{TEST_CONTENT}</Message>
    );
    expect(getByTestId('text').textContent).toEqual(TEST_CONTENT);
  });

  describe('elements', () => {
    it.each(MSG.TYPES)('include icon when type is %s', type => {
      const { getByRole } = render(
        <Message type={type}>{TEST_CONTENT}</Message>
      );
      expect(getByRole('img')).toBeDefined(); // WARNING: Relies on `Icon`
    });
    it.each(MSG.TYPES)('include text when type is %s', type => {
      const { getByTestId } = render(
        <Message type={type}>{TEST_CONTENT}</Message>
      );
      expect(getByTestId('text')).toBeDefined();
    });
  });

  describe('className', () => {
    it.each(MSG.TYPES)('is accurate when type is %s', type => {
      const { getByRole, getByTestId } = render(
        <Message type={type}>{TEST_CONTENT}</Message>
      );

      testClassnamesByType(type, getByRole, getByTestId);
    });
    it.each(MSG.SCOPES)('has accurate className when scope is "%s"', scope => {
      const { getByRole, getByTestId } = render(
        <Message type={TEST_TYPE} scope={scope}>{TEST_CONTENT}</Message>
      );
      const root = getByRole('status');
      const modifierClassName = MSG.SCOPE_CLASS_MAP[scope || MSG.DEFAULT_SCOPE];

      testClassnamesByType(TEST_TYPE, getByRole, getByTestId);
      expect(root.className).toMatch(new RegExp(modifierClassName));
    });
  });
});
