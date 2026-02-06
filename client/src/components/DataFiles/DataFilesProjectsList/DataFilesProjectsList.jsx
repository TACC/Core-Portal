import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import queryStringParser from 'query-string';
import {
  InfiniteScrollTable,
  SectionMessage,
  SectionTableWrapper,
} from '_common';
import styles from './DataFilesProjectsList.module.scss';
import './DataFilesProjectsList.scss';
import Searchbar from '_common/Searchbar';

const DataFilesProjectsList = ({ modal }) => {
  const { error, loading, projects } = useSelector(
    (state) => state.projects.listing
  );
  const modalProps = useSelector((state) => state.files.modalProps[modal]);
  const query = queryStringParser.parse(useLocation().search);

  const infiniteScrollCallback = useCallback(() => {});
  const dispatch = useDispatch();

  useEffect(() => {
    const actionType = modal
      ? 'PROJECTS_GET_LISTING'
      : 'PROJECTS_SHOW_SHARED_WORKSPACES';
    dispatch({
      type: actionType,
      payload: {
        queryString: modal ? null : query.query_string,
        modal,
      },
    });
  }, [dispatch, query.query_string]);

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
        section: 'modal',
      },
    });
    dispatch({
      type: 'DATA_FILES_SET_MODAL_PROPS',
      payload: {
        operation: modal,
        props: { ...modalProps, showProjects: false },
      },
    });
  };

  const columns = [
    {
      Header: 'Title',
      headerStyle: { textAlign: 'left' },
      accessor: 'title',
      Cell: (el) => (
        <Link
          className="data-files-nav-link"
          to={`/workbench/data/tapis/projects/${el.row.original.id}`}
          onClick={(e) => listingCallback(e, el)}
        >
          {el.value}
        </Link>
      ),
    },
    {
      Header: 'Owner',
      accessor: 'owner',
      Cell: (el) => (
        <span>
          {el.value ? `${el.value.first_name} ${el.value.last_name}` : ''}
        </span>
      ),
    },
    {
      Header: 'ID',
      headerStyle: { textAlign: 'left' },
      accessor: 'name',
      Cell: (el) => (
        <span>{el.value ? el.value.split('-').slice(-1)[0] : ''}</span>
      ),
    },
  ];

  const noDataText = query.query_string
    ? 'No Shared Workspaces match your search term.'
    : "You don't have any Shared Workspaces.";

  if (error) {
    return (
      <div className={styles['root-placeholder']}>
        <SectionMessage type="error">
          There was a problem retrieving your Shared Workspaces.
        </SectionMessage>
      </div>
    );
  }

  /**
   * Conditionally wrap element with given component
   * @see https://blog.hackages.io/conditionally-wrap-an-element-in-react-a8b9a47fab2
   */
  function ConditionalWrapper({ condition, wrapper, children }) {
    return condition ? wrapper(children) : children;
  }

  return (
    <SectionTableWrapper
      className={`${styles['root']} ${modal ? styles['is-in-modal'] : ''}`}
      contentShouldScroll
      manualContent
    >
      {!modal && (
        <Searchbar
          api="tapis"
          scheme="projects"
          sectionName="Workspace"
          resultCount={projects.length}
          infiniteScroll
        />
      )}
      <ConditionalWrapper
        condition={!modal}
        wrapper={(children) => {
          return <div className="o-flex-item-table-wrap">{children}</div>;
        }}
      >
        <InfiniteScrollTable
          tableColumns={columns}
          tableData={projects}
          onInfiniteScroll={infiniteScrollCallback}
          isLoading={loading}
          noDataText={noDataText}
          className="projects-listing"
        />
      </ConditionalWrapper>
    </SectionTableWrapper>
  );
};
DataFilesProjectsList.propTypes = {
  modal: PropTypes.string,
};
DataFilesProjectsList.defaultProps = {
  modal: null,
};

export default DataFilesProjectsList;
