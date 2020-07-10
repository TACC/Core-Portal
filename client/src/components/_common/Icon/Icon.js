import React from 'react';
import PropTypes from 'prop-types';

const Icon = ({ name }) => {
  const className = `icon-${name}`;

  return <i className={className} data-testid="icon" />;
};
Icon.propTypes = {
  name: PropTypes.string.isRequired
};

export default Icon;
