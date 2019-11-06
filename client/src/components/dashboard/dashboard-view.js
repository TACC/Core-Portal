// stateless view Component.
import React from "react";
// import Dashboard from "./dashboard-container";
// import Jobs from '../jobs';
import SystemMonitor from '../system-monitor'
import Tickets from '../tickets'
import Jobs from '../jobs'
import {Row, Col} from 'reactstrap';

function Dashboard() {
    return (
        <>
        <h2>Dashboard</h2>
            <Row>
            <Col xs="8"><Jobs /></Col>
            <Col xs="4">
                <SystemMonitor />
                <Tickets />
            </Col>
            </Row>
        </>
    );
}

export default Dashboard;
