import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Icon from '_common/Icon';
import './AppIcon.scss';

const doesClassExist = (className) => {
  // Check if the CSS class exists in the stylesheets
  for (let sheet of document.styleSheets) {
    try {
      for (let rule of sheet.cssRules) {
        if (
          rule.selectorText &&
          rule.selectorText.includes(`.${className}::before`)
        ) {
          return true;
        }
      }
    } catch (e) {
      // Handle cross-origin stylesheet errors
      continue;
    }
  }
  return false;
};

const AppIcon = ({ appId, category }) => {
  const appIcons = useSelector((state) => state.apps.appIcons);
  const findAppIcon = (id) => {
    let appIcon = category
      ? category.replace(' ', '-').toLowerCase()
      : 'applications';
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
    // Check if the CSS class exists, if not default to 'icon-applications'
    if (!doesClassExist(`icon-${appIcon}`)) {
      appIcon = 'applications';
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
