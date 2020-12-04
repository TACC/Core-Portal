import React, { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { InfiniteScrollTable, LoadingSpinner, Message } from '_common';
import './DataFilesProjectsList.scss';

const DataFilesProjectsList = () => {
  const { error, loading, projects } = useSelector(
    state => state.projects.listing
  );

  const infiniteScrollCallback = useCallback(() => {});
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: 'PROJECTS_GET_LISTING'
    });
  }, [dispatch]);

  const columns = [
    {
      Header: 'Workspace Title',
      headerStyle: { textAlign: 'left' },
      accessor: 'description',
      Cell: el => (
        <Link
          className="data-files-nav-link"
          to={`/workbench/data/shared/${el.row.original.id}`}
        >
          {el.value}
        </Link>
      )
    },
    {
      Header: 'Owner',
      accessor: 'owner',
      Cell: el => <span>{el.value ? el.value : ''}</span>
    },
    {
      Header: 'ID',
      headerStyle: { textAlign: 'left' },
      accessor: 'name',
      Cell: el => <span>{el.value.split('-').slice(-1)[0]}</span>
    }
  ];

  const noDataText = "You don't have any Shared Workspaces.";

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Message type="error">
        There was a problem retrieving your Shared Workspaces
      </Message>
    );
  }

  return (
    <InfiniteScrollTable
      tableColumns={columns}
      tableData={projects}
      onInfiniteScroll={infiniteScrollCallback}
      isLoading={loading}
      noDataText={noDataText}
      className="projects-listing"
    />
  );
};

export default DataFilesProjectsList;
