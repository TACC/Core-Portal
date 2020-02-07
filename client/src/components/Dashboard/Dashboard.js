import React from 'react';
import { Button, Container, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import JobsView from '../Jobs';
import Tickets from '../Tickets';
import Sysmon from '../SystemMonitor';
import './Dashboard.scss';

function Dashboard() {
  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h5>Dashboard</h5>
        <Link to="/accounts/profile" className="wb-link">
          <h6>Manage Account</h6>
        </Link>
      </div>
      <Container className="dashboard-items">
        <Row>
          <Col lg="8" className="border-right">
            <div className="jobs-wrapper dash-grid-item">
              <div className="dashboard-item-header">
                <h6>My Recent Jobs</h6>
                <Button color="link">
                  <h6>View History</h6>
                </Button>
              </div>
              <JobsView />
            </div>
          </Col>
          <Col lg="4">
            <div className="sysmon-wrapper dash-grid-item">
              <div className="dashboard-item-header">
                <h6>System Status</h6>
                <Button color="link">
                  <h6>Customize</h6>
                </Button>
              </div>
              <Sysmon />
            </div>
          </Col>
        </Row>
        <Row>
          <Col lg="8" className="border-right">
            <div className="tickets-wrapper dash-grid-item">
              <div className="dashboard-item-header">
                <h6>My Tickets</h6>
                <Button color="link">
                  <h6>Add Ticket</h6>
                </Button>
              </div>
              <Tickets />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Dashboard;
