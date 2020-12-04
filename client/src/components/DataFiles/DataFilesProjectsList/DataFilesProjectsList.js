import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { InfiniteScrollTable } from '_common';

const DataFilesProjectsList = () => {
  const { error, loading, projects } = useSelector(
    state => state.projects.listing
  );

  const infiniteScrollCallback = useCallback(
    () => {}
  )
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: 'PROJECTS_GET_LISTING'
    });
  }, [dispatch])

  const columns = [
    {
      Header: 'Workspace Title',
      headerStyle: { textAlign: 'left' },
      accessor: 'description',
      Cell: el => (
        <span>
          {el.value}
        </span>
      )
    },
    {
      Header: 'Owner',
      accessor: 'owner',
      Cell: el => (
        <span>
          {el.value ? el.value : ''}
        </span>        
      )
    },
    {
      Header: 'ID',
      headerStyle: { textAlign: 'left' },
      accessor: 'name',
      Cell: el => (
        <span>
          {el.value.split('-').slice(-1)[0]}
        </span>
      )
    }
  ];

  const noDataText = "You don't have any Shared Workspaces."

  return (
    <InfiniteScrollTable
      tableColumns={columns}
      tableData={projects}
      onInfiniteScroll={infiniteScrollCallback}
      isLoading={loading}
      noDataText={noDataText}
    />
  );
}

export default DataFilesProjectsList;