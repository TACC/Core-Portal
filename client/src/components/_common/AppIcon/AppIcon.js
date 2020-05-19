import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import './AppIcon.scss';

const AppIcon = ({ appId }) => {
  const { categoryDict } = useSelector(state => ({
    categoryDict: state.apps.categoryDict
  }));

  const findAppIcon = id => {
    let appIcon = 'application';

    Object.keys(categoryDict).forEach(category => {
      categoryDict[category].forEach(app => {
        const { definition } = app.value;
        if (id.includes(definition.id) && 'appIcon' in definition) {
          appIcon = definition.appIcon.toLowerCase();
        }
      });
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
