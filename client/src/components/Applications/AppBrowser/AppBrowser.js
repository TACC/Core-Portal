import React, { useState } from 'react';
import { NavLink as RRNavLink, useRouteMatch } from 'react-router-dom';
import { useSelector, shallowEqual } from 'react-redux';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { AppIcon, Icon, Message } from '_common';
import './AppBrowser.scss';
import * as ROUTES from '../../../constants/routes';

const AppBrowser = () => {
  const { params } = useRouteMatch();
  const [activeTab, setActiveTab] = useState();

  const toggle = tab => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  const { categoryApps, appDict, defaultTab, error } = useSelector(
    state => ({ ...state.apps }),
    shallowEqual
  );

  if (error.isError) {
    return (
      <Message type="warn" className="appDetail-error">
        {error.message ? error.message : 'Something went wrong.'}
      </Message>
    );
  }

  // set activeTab to url app's category if no tab selected
  if (
    Object.keys(appDict).length &&
    params.appId &&
    !activeTab &&
    params.appId in appDict
  ) {
    toggle(appDict[params.appId].value.definition.appCategory); // TODO
  } else if (!activeTab && Object.keys(categoryApps).includes(defaultTab)) {
    toggle(defaultTab);
  }

  return (
    <div id="appBrowser-wrapper">
      <Nav id="appBrowser-sidebar">
        {Object.keys(categoryApps).map(category => (
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
                <span className="nav-text">{`${category} [${
                  Object.keys(categoryApps[category]).length
                }]`}</span>
              </span>
            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <TabContent id="appBrowser-tray" activeTab={activeTab}>
        {Object.keys(categoryApps).map(category => (
          <TabPane tabId={category} key={`${category}tabPane`}>
            <div className="apps-grid-list">
              {Object.entries(categoryApps[category]).map(
                ([appName, appValue]) => (
                  <div
                    key={appValue.specifications[0].id}
                    className="apps-grid-item"
                  >
                    <NavLink
                      tag={RRNavLink}
                      to={`${ROUTES.WORKBENCH}${ROUTES.APPLICATIONS}/${appValue.specifications[0].id}`}
                      activeClassName="active"
                    >
                      <span className="nav-content">
                        <AppIcon appId={appValue.specifications[0].id} />
                        <span className="nav-text">{appName}</span>
                      </span>
                    </NavLink>
                  </div>
                )
              )}
            </div>
          </TabPane>
        ))}
      </TabContent>
    </div>
  );
};

export default AppBrowser;
