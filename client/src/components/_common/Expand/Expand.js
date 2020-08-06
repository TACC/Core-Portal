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

  return (
    <Card styleName="container">
      <CardHeader onClick={toggleCallback}>
        <span styleName="header">
          <strong>{detail}</strong>
        </span>
        <Icon name={isOpen ? 'collapse' : 'expand'} />
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>{message}</CardBody>
      </Collapse>
    </Card>
  );
};

Expand.propTypes = {
  detail: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
};

export default Expand;
