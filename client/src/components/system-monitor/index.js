import React from 'react';
import {Row, Col, Badge} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons'
import useFetch from '../../utils/useFetch';
import './system-monitor.css';

function SystemsList() {
  const res = useFetch(`/api/system-monitor/`, {});

  if (!res.response) {
    return (
      <div id='spin-sun'>
        <FontAwesomeIcon icon={faSun} size="8x" spin />
      </div>
    )
  }

  return (
    <div className="multi-system">
    <Row>
    <Col xs="12">
        <h4><strong>System Status</strong></h4>
    </Col>
    </Row>
    {res && res.response.map((el) => (<div>
    <Row>
    <Col xs="12"><strong>{el.display_name}</strong>
    <div className="name-separator"></div>
    </Col>
    </Row>
    <Row>
    <Col xs="8" className="status-left-padding">System Status</Col>
        <Col xs="4">
        { el.is_operational ?
            <Badge color="success" className="label-system-status">Operational</Badge>
            :
            <Badge color="warning" className="label-system-status">Maintenance</Badge>
        }
        </Col>
    </Row>
    <div className="system-separator" />
    </div>))}
    </div>
  );
}

function SystemMonitor() {

  return (
      <SystemsList id="systems"/>
  );
}
export default SystemMonitor;
