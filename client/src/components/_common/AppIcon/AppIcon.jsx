import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Icon from '_common/Icon';
import './AppIcon.scss';

const AppIcon = ({ appId, category }) => {
  const appIcons = useSelector((state) => state.apps.appIcons);
  const findAppIcon = (id) => {
    if (!category) {
      console.error('Category is undefined for appId:', id);
      return 'applications';
    }
    let appIcon = category.replace(' ', '-').toLowerCase();
    Object.keys(appIcons).forEach((appName) => {
      if (id.includes(appName)) {
        appIcon = appIcons[appName].toLowerCase();
        return appIcon;
      }
    });
    if (id.includes('compress') || id.includes('zippy')) {
      appIcon = 'compress';
    } else if (id.includes('extract')) {
      appIcon = 'extract';
    }
    return appIcon;
  };
  const iconName = findAppIcon(appId);

  return <Icon name={iconName} />;
};
AppIcon.propTypes = {
  appId: PropTypes.string.isRequired,
  category: PropTypes.string,
};

AppIcon.defaultProps = {
  category: 'applications',
};

export default AppIcon;
