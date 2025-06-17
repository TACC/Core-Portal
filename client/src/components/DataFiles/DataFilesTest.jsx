import { React, useEffect } from 'react';

import LoadingSpinner from '_common/LoadingSpinner';
import { useExternalStyles } from 'hooks/datafiles';

function DataTable() {
  const { hostRef, areStylesLoaded, renderWithStyles } = useExternalStyles();

  useEffect(() => {
    if (areStylesLoaded) {
      renderWithStyles(
        <div>
          <h2>Browse Datasets</h2>
          <p>Sample content.</p>
        </div>
      );
    }
  }, [areStylesLoaded, renderWithStyles]);

  if (!areStylesLoaded) {
    return <LoadingSpinner />;
  }

  return <div ref={hostRef}></div>;
}

export default DataTable;
