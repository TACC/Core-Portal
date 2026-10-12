import React from 'react';
import PropTypes from 'prop-types';

export default function NameWithDesc({ children, desc, className, ...rest }) {
  if (children === null || children === undefined) return null;

  return desc ? (
    <abbr title={desc} className={className} {...rest}>
      {children}
    </abbr>
  ) : (
    <>{children}</>
  );
}

NameWithDesc.propTypes = {
  children: PropTypes.node,
  desc: PropTypes.string,
  className: PropTypes.string,
};
