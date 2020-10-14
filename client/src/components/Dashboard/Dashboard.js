import React from 'react';
import { Button } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';

import {
  BrowserChecker,
  Section,
  SectionHeader,
  SectionContent,
  SectionTable
} from '_common';
import JobsView from '../Jobs';
import Tickets, { TicketModal, TicketCreateModal } from '../Tickets';
import Sysmon from '../SystemMonitor';
import * as ROUTES from '../../constants/routes';
import './Dashboard.scss';

function Dashboard() {
  const dispatch = useDispatch();
  // const temporaryCSS = `
  // .table-wrapper th {
  //   position: sticky;
  //   top: 0;
  // }
  // `;

  return (
    <Section
      routeName="DASHBOARD"
      messages={<BrowserChecker />}
      // header="Dashboard"
      // headerClassName="dashboard-header"
      // headerActions={
      //   <Link to="/accounts/profile" className="wb-link">
      //     Manage Account
      //   </Link>
      // }
      manualHeader={
        <SectionHeader
          className="dashboard-header"
          actions={
            <Link to="/accounts/profile" className="wb-link">
              Manage Account
            </Link>
          }
        >
          Dashboard
        </SectionHeader>
      }
      // contentClassName="dashboard-items"
      // contentLayoutName="twoColumn"
      // contentShouldScroll
      manualContent={
        <SectionContent
          className="dashboard-items"
          layoutName="twoColumn"
          shouldScroll
        >
          <div className="sysmon-wrapper">
            <SectionTable
              header={
                <SectionHeader className="dashboard-item-header">
                  System Status
                </SectionHeader>
              }
            >
              <Sysmon />
            </SectionTable>
          </div>
          {/*
          <div className="sysmon-wrapper">
            <SectionTable
              header={
                <SectionHeader className="dashboard-item-header">
                  Bystem Btatus
                </SectionHeader>
              }
            >
              <Sysmon />
            </SectionTable>
          </div>
          */}
          <div className="jobs-wrapper">
            <SectionTable
              header={
                <SectionHeader
                  className="dashboard-item-header"
                  actions={
                    <Link to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs`}>
                      <Button color="link">
                        <h6>View History</h6>
                      </Button>
                    </Link>
                  }
                >
                  My Recent Jobs
                </SectionHeader>
              }
            >
              <JobsView />
            </SectionTable>
          </div>
          <div className="tickets-wrapper">
            {/* <style>{temporaryCSS}</style> */}
            <SectionTable
              header={
                <SectionHeader
                  className="dashboard-item-header"
                  actions={
                    <Link
                      to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
                    >
                      <Button color="link">
                        <h6>Add Ticket</h6>
                      </Button>
                    </Link>
                  }
                >
                  My Tickets
                </SectionHeader>
              }
            >
              <Tickets />
            </SectionTable>
          </div>
          <Switch>
            <Route
              exact
              path={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
              render={() => {
                dispatch({
                  type: 'TICKETS_CREATE_INIT'
                });
                return <TicketCreateModal />;
              }}
            />
            <Route
              path={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/:ticketId`}
              render={({ match: { params } }) => {
                dispatch({
                  type: 'TICKET_DETAILED_VIEW_OPEN',
                  payload: { ticketId: Number(params.ticketId) }
                });
                return <TicketModal />;
              }}
            />
          </Switch>
        </SectionContent>
      }
    />
  );
}

export default Dashboard;
