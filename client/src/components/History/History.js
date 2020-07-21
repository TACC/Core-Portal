import React from 'react';
import {
  Route,
  Switch,
  Redirect,
  NavLink as RRNavLink
} from 'react-router-dom';

import { Button, Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import * as ROUTES from '../../constants/routes';
import JobHistory from './JobHistory';
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
        <div className="nav-content">
          <FontAwesomeIcon icon={faDesktop} size="1x" />
          <span className="nav-text">Jobs</span>
        </div>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink tag={RRNavLink} to={`${root}/uploads`} activeClassName="active">
        <div className="nav-content">
          <i className="icon icon-action-upload" />
          <span className="nav-text">Uploads</span>
        </div>
      </NavLink>
    </NavItem>
    <NavItem>
      <NavLink tag={RRNavLink} to={`${root}/files`} activeClassName="active">
        <div className="nav-content">
          <i className="icon icon-nav-folder" />
          <span className="nav-text">Files</span>
        </div>
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
            <Route path={`${root}/jobs`}>
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
