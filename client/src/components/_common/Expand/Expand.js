import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CardHeader, CardBody, Card, Collapse } from 'reactstrap';
import './Expand.global.scss';
import './Expand.module.scss';

const Expand = ({ detail, message }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleCallback = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  return (
    <Card className="mt-1">
      <CardHeader onClick={toggleCallback}>
        <span styleName="header" className="d-inline-block text-truncate">
          <strong>{detail}</strong>
        </span>
        <i
          styleName="icon-action"
          className={`icon-action ${isOpen ? 'icon-collapse' : 'icon-expand'}`}
        />
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
