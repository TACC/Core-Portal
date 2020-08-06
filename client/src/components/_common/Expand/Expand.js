import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CardHeader, CardBody, Card, Collapse } from 'reactstrap';
import Icon from '../Icon';
import './Expand.global.scss';
import './Expand.module.scss';

const Expand = ({ detail, message }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleCallback = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  // TODO: Use `details/summary` tags, when `onToggle` support is "last 2 versions"
  // SEE: https://github.com/facebook/react/issues/15486#issuecomment-669674869
  return (
    <Card styleName="container" tag="div">
      <CardHeader onClick={toggleCallback} tag="div">
        <strong styleName="header">{detail}</strong>
        <Icon name={isOpen ? 'collapse' : 'expand'} />
      </CardHeader>
      <Collapse isOpen={isOpen} tag={CardBody}>
        {message}
      </Collapse>
    </Card>
  );
};

Expand.propTypes = {
  detail: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
};

export default Expand;
