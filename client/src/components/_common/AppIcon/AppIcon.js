import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import './AppIcon.scss';

const AppIcon = ({ appId }) => {
  const appIcons = useSelector(state => state.apps.appIcons);
  const findAppIcon = id => {
    let appIcon = 'application';
    Object.keys(appIcons).forEach(appName => {
      if (id.includes(appName)) {
        appIcon = appIcons[appName].toLowerCase();
      }
    });
    return appIcon;
  };

  return (
    <i
      className={`app-icon icon-nav-${findAppIcon(appId)}`}
      data-testid="app-icon"
    />
  );
};
AppIcon.propTypes = {
  appId: PropTypes.string.isRequired
};

export default AppIcon;
