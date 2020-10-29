import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';

import { BrowserChecker, Section, SectionTable } from '_common';
import JobsView from '../Jobs';
import Tickets, { TicketModal, TicketCreateModal } from '../Tickets';
import Sysmon from '../SystemMonitor';
import * as ROUTES from '../../constants/routes';
import './Dashboard.scss';

function Dashboard() {
  const dispatch = useDispatch();
  const sectionClass = 'has-loaded-dashboard';

  useEffect(() => {
    document.body.classList.add(sectionClass);

    return function cleanup() {
      document.body.classList.remove(sectionClass);
    };
  }, [sectionClass]);

  return (
    <Section
      routeName="DASHBOARD"
      messages={<BrowserChecker />}
      header="Dashboard"
      headerActions={
        <Link to="/accounts/profile" className="wb-link">
          Manage Account
        </Link>
      }
      contentClassName="dashboard-items"
      contentLayoutName="twoColumn"
      contentShouldScroll
      content={
        <>
          <SectionTable
            header="System Status"
            className="sysmon-wrapper"
            shouldScroll
          >
            <Sysmon />
          </SectionTable>
          {/*
          <SectionTable header="Bystem Badass" className="sysmon-wrapper">
            <Sysmon />
          </SectionTable>
          */}
          <SectionTable
            className="jobs-wrapper"
            header="My Recent Jobs"
            headerActions={
              <Link
                to={`${ROUTES.WORKBENCH}${ROUTES.HISTORY}/jobs`}
                className="wb-link"
              >
                View History
              </Link>
            }
            shouldScroll
          >
            <JobsView />
          </SectionTable>
          <SectionTable
            className="tickets-wrapper"
            header="My Tickets"
            headerActions={
              <Link
                to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
                className="wb-link"
              >
                Add Ticket
              </Link>
            }
            shouldScroll
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
