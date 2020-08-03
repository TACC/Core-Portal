import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Icon from '_common/Icon';

/* RFC: Gather and isolate icon name functions from these files:
        `AppIcon.js`, `AppCategoryIcon.js`, and `app.sagas.js` */

/**
 * Find name of icon for category
 * @param {string} id - Category identifier
 * @param {Object.<string, string>} appIcons - Map of identifiers to icon names
 */
export function findAppCategoryIcon(id, categoryIcons = {}) {
  let appCategoryIcon = '';
  Object.keys(categoryIcons).forEach(categoryName => {
    if (id === categoryName) {
      appCategoryIcon = categoryIcons[categoryName].toLowerCase();
    }
  });
  return appCategoryIcon;
}

const AppCategoryIcon = ({ categoryId }) => {
  const categoryIcons = useSelector(state => state.apps.categoryIcons);
  const iconName =
    findAppCategoryIcon(categoryId, categoryIcons) || 'applications';

  return <Icon name={iconName} />;
};
AppCategoryIcon.propTypes = {
  categoryId: PropTypes.string.isRequired
};

export default AppCategoryIcon;
