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

CMSWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CMSWrapper;
