import React, { useEffect } from 'react';

import PropTypes from 'prop-types';

function CMSWrapper({ children }) {
  useEffect(() => {
    // To (de)activate CMS styles on (un)mount
    window.dispatchEvent(new CustomEvent('cms-styles-activated'));
    return () => {
      window.dispatchEvent(new CustomEvent('cms-styles-deactivated'));
    };
  }, []);

  return (
    <main id="mimic-cms" className="container">
      {children}
    </main>
  );
}

/**
 * Dynamically load stylesheets and returns a cleanup function
 *
 * @param {string[]} urls - Array of stylesheet URLs to load
 * @param {string} [componentName] - Name of the component (for log and debug)
 * @returns {Function} Cleanup function that unloads the stylesheets
 *
 * @example
 * useEffect(() => {
 *   return CMSWrapper.useDynamicStylesheets([
 *     'https://example.com/styles1.css',
 *     'https://example.com/styles2.css'
 *   ]);
 * }, []);
 */
CMSWrapper.useDynamicStylesheets = (urls, componentName) => {
  const links = urls.map((url, index) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.id = `cms-wrapper-styles-from-${componentName || 'undefined'}-${index}`;
    document.head.appendChild(link);
    return link;
  });
  
  return () => links.forEach(link => link.remove());
};

CMSWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CMSWrapper;
