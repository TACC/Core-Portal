import React, { useEffect, useLayoutEffect } from 'react';
import {
  useLocation,
  useHistory,
  Switch,
  Route,
  useParams
} from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { Section, SectionTable, LoadingSpinner } from '_common';
import DataFilesBreadcrumbs from '../DataFiles/DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesListing from '../DataFiles/DataFilesListing/DataFilesListing';
import DataFilesPreviewModal from '../DataFiles/DataFilesModals/DataFilesPreviewModal';
import { ToolbarButton } from '../DataFiles/DataFilesToolbar/DataFilesToolbar';

import './PublicData.module.css';

const PublicData = () => {
  const { pathname } = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();

  const publicDataSystem = useSelector(
    state =>
      state.systems.storage.configuration.find(
        sys => sys.scheme === 'public'
      ) || {}
  );
  const selectedFiles = useSelector(state =>
    state.files.selected.FilesListing.map(
      i => state.files.listing.FilesListing[i]
    )
  );

  const canDownload =
    selectedFiles.length === 1 && selectedFiles[0].format !== 'folder';
  const download = () => {
    dispatch({
      type: 'DATA_FILES_DOWNLOAD',
      payload: { file: selectedFiles[0] }
    });
  };

  useLayoutEffect(() => {
    dispatch({ type: 'FETCH_SYSTEMS' });
  }, [pathname]);

  useEffect(() => {
    if (publicDataSystem.system) {
      history.push(`/public-data/tapis/public/${publicDataSystem.system}/`);
    }
  }, [publicDataSystem.system]);

  return (
    <>
      <Switch>
        <Route path="/public-data/:api/:scheme/:system/:path*">
          {publicDataSystem.system ? (
            <>
              <PublicDataListing
                canDownload={canDownload}
                downloadCallback={download}
              />
            </>
          ) : (
            <LoadingSpinner />
          )}
        </Route>
      </Switch>
      <DataFilesPreviewModal />
    </>
  );
};

const PublicDataListing = ({ canDownload, downloadCallback }) => {
  const { api, scheme, system, path } = useParams();
  const dispatch = useDispatch();
  useLayoutEffect(() => {
    dispatch({
      type: 'FETCH_FILES',
      payload: {
        api,
        system,
        scheme,
        path: path || '',
        section: 'FilesListing'
      }
    });
  }, [path]);

  return (
    /* !!!: Temporary bad indentation to make simpler PR diff */
    /* eslint-disable prettier/prettier */
    <Section
      // HACK: Replicate wrapper class gives button correct global style
      // WARNING: Applies unused and redundant `.workbench-content` styles
      className="workbench-content"
      header={
        <DataFilesBreadcrumbs
          api={api}
          scheme={scheme}
          system={system}
          path={path || ''}
          section="FilesListing"
          isPublic
        />
      }
      headerActions={
        <ToolbarButton
          text="Download"
          iconName="download"
          onClick={downloadCallback}
          disabled={!canDownload}
        />
      }
    >
      <SectionTable styleName="content" manualContent>
        {/* FP-889: Add searchbar here (this is why `manualContent` is used) */}
        {/* SEE: client/src/components/DataFiles/DataFiles.js */}
        {/* <DataFilesSearchbar
          api={api}
          scheme={scheme}
          system={system}
        /> */}
        <div className="o-flex-item-table-wrap">
      <DataFilesListing
        api={api}
        scheme={scheme}
        system={system}
        path={path || '/'}
        isPublic
      />
        </div>
      </SectionTable>
    </Section>
    /* eslint-enable prettier/prettier */
  );
};
PublicDataListing.propTypes = {
  canDownload: PropTypes.bool.isRequired,
  downloadCallback: PropTypes.func.isRequired
};

export default PublicData;
