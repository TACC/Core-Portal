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
import { LoadingSpinner } from '_common';
import DataFilesBreadcrumbs from '../DataFiles/DataFilesBreadcrumbs/DataFilesBreadcrumbs';
import DataFilesListing from '../DataFiles/DataFilesListing/DataFilesListing';
import DataFilesPreviewModal from '../DataFiles/DataFilesModals/DataFilesPreviewModal';
import DataFilesSearchbar from '../DataFiles/DataFilesSearchbar/DataFilesSearchbar';
import { ToolbarButton } from '../DataFiles/DataFilesToolbar/DataFilesToolbar';

import './PublicData.module.css';

const PublicData = () => {
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
  }, []);

  useEffect(() => {
    if (publicDataSystem.system) {
      history.push(`/public-data/tapis/public/${publicDataSystem.system}/`);
    }
  }, [publicDataSystem.system]);

  return (
    <div>
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
    </div>
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
    <div styleName="container">
      <DataFilesSearchbar
        api="tapis"
        scheme="public"
        system={system}
        publicData
      />
      <div styleName="header">
        <DataFilesBreadcrumbs
          styleName="header-title"
          api={api}
          scheme={scheme}
          system={system}
          path={path || ''}
          section="FilesListing"
          isPublic
        />
        <ToolbarButton
          text="Download"
          iconName="download"
          onClick={downloadCallback}
          disabled={!canDownload}
        />
      </div>
      <DataFilesListing
        api={api}
        scheme={scheme}
        system={system}
        path={path || '/'}
        isPublic
      />
    </div>
  );
};
PublicDataListing.propTypes = {
  canDownload: PropTypes.bool.isRequired,
  downloadCallback: PropTypes.func.isRequired
};

export default PublicData;
