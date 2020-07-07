import React from 'react';
import PropTypes from 'prop-types';

const MessageIcon = ({ name }) => {
  const className = `icon-${name}`;

  return <i className={className} data-testid="root" />;
};
MessageIcon.propTypes = {
  name: PropTypes.string.isRequired
};

export default MessageIcon;
