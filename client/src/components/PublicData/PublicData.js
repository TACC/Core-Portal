import React, { useEffect, useLayoutEffect } from 'react';
import {
  useHistory,
  Switch,
  Route,
  useParams,
  useLocation
} from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { parse } from 'query-string';
import { Section, SectionTableWrapper, LoadingSpinner } from '_common';
import DataFilesBreadcrumbs from '../DataFiles/DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesListing from '../DataFiles/DataFilesListing/DataFilesListing';
import DataFilesPreviewModal from '../DataFiles/DataFilesModals/DataFilesPreviewModal';
import DataFilesSearchbar from '../DataFiles/DataFilesSearchbar/DataFilesSearchbar';
import { ToolbarButton } from '../DataFiles/DataFilesToolbar/DataFilesToolbar';

import './PublicData.module.css';

const PublicData = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const location = useLocation();
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
  }, []);

  useEffect(() => {
    const pathLength = location.pathname.split('/').length;
    if (publicDataSystem.system && pathLength < 6) {
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
  const queryString = parse(useLocation().search).query_string;
  useLayoutEffect(() => {
    dispatch({
      type: 'FETCH_FILES',
      payload: {
        api,
        system,
        scheme,
        path: path || '',
        queryString,
        section: 'FilesListing'
      }
    });
  }, [path, queryString]);

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
      <SectionTableWrapper styleName="content" manualContent>
        <DataFilesSearchbar
          api="tapis"
          scheme="public"
          system={system}
          publicData
        />
      <DataFilesListing
        api={api}
        scheme={scheme}
        system={system}
        path={path || '/'}
        isPublic
      />
      </SectionTableWrapper>
    </Section>
    /* eslint-enable prettier/prettier */
  );
};
PublicDataListing.propTypes = {
  canDownload: PropTypes.bool.isRequired,
  downloadCallback: PropTypes.func.isRequired
};

export default PublicData;
