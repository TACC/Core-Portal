import React from 'react';
import {
  Route,
  Switch,
  Redirect,
  NavLink as RRNavLink
} from 'react-router-dom';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import * as ROUTES from '../../constants/routes';
import JobHistory from './JobHistory';
import './History.scss';

const root = `${ROUTES.WORKBENCH}${ROUTES.HISTORY}`;

const HistorySidebar = () => (
  <Nav className="history-sidebar" vertical>
    <NavItem>
      <NavLink tag={RRNavLink} to={`${root}/jobs`} activeClassName="active">
        <FontAwesomeIcon icon={faDesktop} size="1x" className="link-icon" />
        <span className="link-text">Jobs</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink tag={RRNavLink} to={`${root}/uploads`} activeClassName="active">
        <FontAwesomeIcon icon={faDesktop} size="1x" className="link-icon" />
        <span className="link-text">Uploads</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink tag={RRNavLink} to={`${root}/files`} activeClassName="active">
        <FontAwesomeIcon icon={faDesktop} size="1x" className="link-icon" />
        <span className="link-text">Files</span>
      </NavLink>
    </NavItem>
  </Nav>
);

const History = () => {
  return (
    <div className="history-container">
      <HistorySidebar />
      <Switch>
        <Route exact path={`${root}/jobs`}>
          <JobHistory />
        </Route>
        <Route exact path={`${root}/uploads`}>
          <h2>Uploads</h2>
        </Route>
        <Route exact path={`${root}/files`}>
          <h2>Files</h2>
        </Route>
        <Redirect from={root} to={`${root}/jobs`} />
      </Switch>
    </div>
  );
};

export default History;
