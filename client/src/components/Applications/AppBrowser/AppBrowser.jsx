import React, { useState } from 'react';
import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import { useSelector, shallowEqual } from 'react-redux';
// import PropTypes from 'prop-types';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { AppIcon, Icon, Message } from '_common';
import './AppBrowser.scss';
import * as ROUTES from '../../../constants/routes';

const findAppTab = (categoryDict, appId) => {
  return Object.keys(categoryDict).find(category =>
    categoryDict[category].some(app => app.appId === appId)
  );
};

const AppBrowser = () => {
  const { params } = useRouteMatch();
  const [activeTab, setActiveTab] = useState();

  const toggle = tab => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const { categoryDict, defaultTab, error } = useSelector(
    state => ({ ...state.apps }),
    shallowEqual
  );

  if (error.isError) {
    return (
      <div id="appBrowser-wrapper" className="appDetail-error">
        <Message type="warn">
          {error.message ? error.message : 'Something went wrong.'}
        </Message>
      </div>
    );
  }

  // set activeTab to url app's category if no tab selected
  if (params.appId && !activeTab) {
    toggle(findAppTab(categoryDict, params.appId));
  } else if (!activeTab && Object.keys(categoryDict).includes(defaultTab)) {
    toggle(defaultTab);
  }

  return (
    <div id="appBrowser-wrapper">
      <Nav id="appBrowser-sidebar">
        {Object.keys(categoryDict).map(category => (
          <NavItem key={category}>
            <NavLink
              className={activeTab === category ? 'active' : null}
              onClick={() => {
                toggle(category);
              }}
            >
              <span className="nav-content">
                <Icon
                  name="applications"
                  className={`icon-${category.replace(' ', '-').toLowerCase()}`}
                />
                <span className="nav-text">{`${category} [${categoryDict[category].length}]`}</span>
              </span>
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <TabContent id="appBrowser-tray" activeTab={activeTab}>
        {Object.keys(categoryDict).map(category => (
          <TabPane tabId={category} key={`${category}tabPane`}>
            <div className="apps-grid-list">
              {categoryDict[category].map(app => (
                <div key={app.appId} className="apps-grid-item">
                  <NavLink
                    tag={RRNavLink}
                    to={`${ROUTES.WORKBENCH}${ROUTES.APPLICATIONS}/${app.appId}`}
                    activeClassName="active"
                  >
                    <span className="nav-content">
                      <AppIcon appId={app.appId} />
                      <span className="nav-text">{app.label}</span>
                    </span>
                  </NavLink>
                </div>
              ))}
            </div>
          </TabPane>
        ))}
      </TabContent>
    </div>
  );
};

export default AppBrowser;
