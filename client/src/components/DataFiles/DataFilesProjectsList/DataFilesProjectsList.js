import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { InfiniteScrollTable, SectionMessage, SectionTable } from '_common';
import './DataFilesProjectsList.module.scss';
import './DataFilesProjectsList.scss';

const DataFilesProjectsList = ({ modal }) => {
  const { error, loading, projects } = useSelector(
    state => state.projects.listing
  );

  const infiniteScrollCallback = useCallback(() => {});
  const dispatch = useDispatch();

  useEffect(() => {
    const actionType = modal
      ? 'PROJECTS_GET_LISTING'
      : 'PROJECTS_SHOW_SHARED_WORKSPACES';
    dispatch({
      type: actionType
    });
  }, [dispatch]);

  const listingCallback = (e, el) => {
    if (!modal) return;
    e.preventDefault();
    dispatch({
      type: 'FETCH_FILES',
      payload: {
        api: 'tapis',
        system: el.row.original.id,
        scheme: 'projects',
        path: '',
        section: 'modal'
      }
    });
    dispatch({
      type: 'DATA_FILES_SET_MODAL_PROPS',
      payload: {
        operation: modal,
        props: { showProjects: false }
      }
    });
  };

  const columns = [
    {
      Header: 'Workspace Title',
      headerStyle: { textAlign: 'left' },
      accessor: 'description',
      Cell: el => (
        <Link
          className="data-files-nav-link"
          to={`/workbench/data/tapis/projects/${el.row.original.id}`}
          onClick={e => listingCallback(e, el)}
        >
          {el.value}
        </Link>
      )
    },
    {
      Header: 'Owner',
      accessor: 'owner',
      Cell: el => (
        <span>
          {el.value ? `${el.value.first_name} ${el.value.last_name}` : ''}
        </span>
      )
    },
    {
      Header: 'ID',
      headerStyle: { textAlign: 'left' },
      accessor: 'name',
      Cell: el => <span>{el.value.split('-').slice(-1)[0]}</span>
    }
  ];

  const noDataText = "You don't have any Shared Workspaces.";

  if (error) {
    return (
      <div styleName="content-placeholder">
        <SectionMessage type="error">
          There was a problem retrieving your Shared Workspaces.
        </SectionMessage>
      </div>
    );
  }

  return (
    <SectionTable styleName="root" shouldScroll>
      <InfiniteScrollTable
        tableColumns={columns}
        tableData={projects}
        onInfiniteScroll={infiniteScrollCallback}
        isLoading={loading}
        noDataText={noDataText}
        className="projects-listing"
      />
    </SectionTable>
  );
};
DataFilesProjectsList.propTypes = {
  modal: PropTypes.string
};
DataFilesProjectsList.defaultProps = {
  modal: null
};

export default DataFilesProjectsList;
