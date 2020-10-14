import React from 'react';
import { Button } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';

import { BrowserChecker, Section, SectionHeader, SectionTable } from '_common';
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
      header="Dashboard"
      headerClassName="dashboard-header"
      headerActions={
        <Link to="/accounts/profile" className="wb-link">
          Manage Account
        </Link>
      }
      contentClassName="dashboard-items"
      contentLayoutName="twoColumn"
      content={
        <>
          <SectionTable
            className="sysmon-wrapper"
            manualHeader={
              <SectionHeader className="dashboard-item-header" isForTable>
                System Status
              </SectionHeader>
            }
          >
            <Sysmon />
          </SectionTable>
          {/*
          <SectionTable
            className="sysmon-wrapper"
            manualHeader={
              <SectionHeader className="dashboard-item-header">
                Bystem Btatus
              </SectionHeader>
            }
          >
            <Sysmon />
          </SectionTable>
          */}
          <SectionTable
            className="jobs-wrapper"
            manualHeader={
              <SectionHeader
                className="dashboard-item-header"
                actions={
                  <Link to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs`}>
                    <Button color="link">
                      <h6>View History</h6>
                    </Button>
                  </Link>
                }
                isForTable
              >
                My Recent Jobs
              </SectionHeader>
            }
          >
            <JobsView />
          </SectionTable>
          {/* <style>{temporaryCSS}</style> */}
          <SectionTable
            className="tickets-wrapper"
            manualHeader={
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
                isForTable
              >
                My Tickets
              </SectionHeader>
            }
          >
            <Tickets />
          </SectionTable>
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
        </>
      }
    />
  );
}

export default Dashboard;
