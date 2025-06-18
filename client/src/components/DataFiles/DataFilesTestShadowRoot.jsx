import { React, useEffect } from 'react';

import { LoadingSpinner, InlineMessage } from '_common';
import { useExternalStyles } from 'hooks/datafiles';

function DataGallery() {
  const { hostRef, styleStatus, renderWithStyles } = useExternalStyles();

  useEffect(() => {
    // IDEA: How about change these to single value like `isReadyToRenderWithStyles`?
    if (hostRef.current && styleStatus.completed) {
      renderWithStyles(
        <div>
          <h2>Browse Datasets</h2>
          {styleStatus.failed.length > 0 && (
            <InlineMessage type="warn">
              Some styles failed to load. UI may look incorrect.
            </InlineMessage>
          )}
          <p>Sample content.</p>
        </div>
      );
    }
  }, [hostRef.current, styleStatus, renderWithStyles]);


  if (!styleStatus.completed) {
    return <div ref={hostRef}><LoadingSpinner /></div>;
  }

  return <div ref={hostRef}></div>;
}

export default DataGallery;
