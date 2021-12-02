import React from 'react';
import PropTypes from 'prop-types';
import { Button as BootstrapButton } from 'reactstrap';

import './Button.module.scss';

// Allow us to limit or map types, and support `type` prop (more semantic)
export const TYPES = [
  '',
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'danger',
  'link'
];
export const DEFAULT_TYPE = 'secondary'; // From `reactstrap`

// FP-515: Use `Icon` component, instead (less verbose, no need for function)
function createIcon(name, testIdSuffix) {
  return (
    <i
      className={`icon ${name}`}
      styleName="icon"
      data-testid={`icon-${testIdSuffix}`}
    />
  );
}

const Button = ({
  children,
  iconBeforeName,
  iconAfterName,
  color,
  type,
  ...props
}) => {
  let iconBefore, iconAfter;
  if (iconBeforeName) iconBefore = createIcon(iconBeforeName, 'before');
  if (iconAfterName) iconAfter = createIcon(iconAfterName, 'after');
  const colorType = color || type;
  const colorAttr = colorType === '' ? {} : { color: colorType };


  if (iconAfterName) {
    console.log("iconAfterName = True")
  }
  console.log("...props = ");
  console.log({...props});
  console.log("children = ");
  console.log(children);
  console.log("iconBeforeName = ");
  console.log(iconBeforeName);
  console.log("iconAfterName = ");
  console.log(iconAfterName);
  console.log("colorType = ");
  console.log(colorType);
  console.log("colorAttr = ");
  console.log(colorAttr)


  return (
    <BootstrapButton
      // FAQ: This is a one-off, so it does not belong in `.eslintrc`
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      // FAQ: Magic syntax for conditional property
      // eslint-disable-next-line react/jsx-props-no-spreading
      // {...colorAttr}
      color={colorType}
      styleName="container"
      data-testid="button"
    >
      {iconBefore}
      <span styleName="text" data-testid="text">
        {children}
      </span>
      {iconAfter}
    </BootstrapButton>
  );
};
Button.propTypes = {
  /** Name of icon after button text */
  iconAfterName: PropTypes.string,
  /** Name of icon before button text */
  iconBeforeName: PropTypes.string,
  /** Button text */
  children: PropTypes.string.isRequired,
  /**
   * Button type/style (backwards-compatibility of prop with non-semantic name)
   * @deprecated since FP-545
   */
  color: PropTypes.oneOf(TYPES),
  /** Button type/style */
  type: PropTypes.oneOf(TYPES)
};
Button.defaultProps = {
  iconBeforeName: '',
  iconAfterName: '',
  color: '',
  type: ''
};

export default Button;
