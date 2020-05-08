import React from 'react';
import {
  Route,
  Switch,
  Redirect,
  NavLink as RRNavLink
} from 'react-router-dom';

import {Button, Nav, NavItem, NavLink} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import * as ROUTES from '../../constants/routes';
import JobHistory from './JobHistory';
import PropTypes from 'prop-types';
import './History.scss';

const root = `${ROUTES.WORKBENCH}${ROUTES.HISTORY}`;

export const HistoryHeader = ({ title }) => {
  return (
    <div className="history-header">
      <span className="history-header__text"> History / {title} </span>
      <Button className="history-header__button" color="link">
        Mark All as Viewed
      </Button>
    </div>
  );
};
HistoryHeader.propTypes = { title: PropTypes.string.isRequired };

const HistorySidebar = () => (
  <Nav className="history-sidebar" vertical>
    <NavItem>
      <NavLink tag={RRNavLink} to={`${root}/jobs`} activeClassName="active">
        <FontAwesomeIcon icon={faDesktop} size="1x" className="side-nav-icon" />
        <span className="nav-text">Jobs</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink tag={RRNavLink} to={`${root}/uploads`} activeClassName="active">
        <FontAwesomeIcon icon={faDesktop} size="1x" className="side-nav-icon" />
        <span className="nav-text">Uploads</span>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink tag={RRNavLink} to={`${root}/files`} activeClassName="active">
        <FontAwesomeIcon icon={faDesktop} size="1x" className="side-nav-icon" />
        <span className="nav-text">Files</span>
      </NavLink>
    </NavItem>
  </Nav>
);

const History = () => {
  return (
    <span className="history-wrapper">
      <Route
        exact
        path={`${root}/:historyType`}
        render={({ match }) => {
          const historyType =
            match.params.historyType.substr(0, 1).toUpperCase() +
            match.params.historyType.substr(1).toLowerCase();
          return <HistoryHeader title={historyType} />;
        }}
      />
      <div className="history-container">
        <HistorySidebar />
        <div className="history-content">
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
      </div>
    </span>
  );
};

export default History;
