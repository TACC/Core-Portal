import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Icon from '_common/Icon';
import { findAppCategoryIcon } from '_common/AppCategoryIcon';

/* RFC: Gather and isolate icon name functions from these files:
        `AppIcon.js`, `AppCategoryIcon.js`, and `app.sagas.js` */

/**
 * Find name of icon for app
 * @param {string} id - App identifier
 * @param {Object.<string, string>} appIcons - Map of identifiers to icon names
 */
function findAppIcon(id, appIcons) {
  let appIcon = '';
  Object.keys(appIcons).forEach(appName => {
    // FAQ: Using `includes` (instead of eqaulity) to find `prtl.clone` apps,
    //      example: `prtl.clone.username.allocation.jupyter`
    if (id.includes(appName)) {
      appIcon = appIcons[appName].toLowerCase();
    }
  });
  return appIcon;
}

const AppIcon = ({ appId, categoryId }) => {
  const appIcons = useSelector(state => state.apps.appIcons);
  const categoryIcons = useSelector(state => state.apps.categoryIcons);
  const iconName =
    findAppIcon(appId, appIcons) ||
    findAppCategoryIcon(categoryId, categoryIcons) ||
    'applications';

  return <Icon name={iconName} />;
};
AppIcon.propTypes = {
  appId: PropTypes.string.isRequired,
  categoryId: PropTypes.string
};
AppIcon.defaultProps = {
  categoryId: ''
};

export default AppIcon;
