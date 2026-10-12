import React, { useEffect, useCallback } from 'react';
import {
  Button,
  InfiniteScrollTable,
  SectionMessage,
  SectionTableWrapper,
} from '_common';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import Searchbar from '_common/Searchbar';
import './DataFilesReviewProjectList.scss';
import styles from './DataFilesReviewProjectList.module.scss';
import queryStringParser from 'query-string';
import { formatDate } from 'utils/timeFormat';

const DataFilesReviewProjectList = ({ rootSystem }) => {
  const { error, loading, projects } = useSelector(
    (state) => state.projects.listing
  );

  const query = queryStringParser.parse(useLocation().search);

  const infiniteScrollCallback = useCallback(() => {});
  const dispatch = useDispatch();

  useEffect(() => {
    const actionType = 'PROJECTS_SHOW_SHARED_WORKSPACES';
    dispatch({
      type: actionType,
      payload: {
        queryString: query.query_string,
        rootSystem: rootSystem,
      },
    });
  }, [dispatch, query.query_string, rootSystem]);

  const createProjectDescriptionModal = (title, description) => {
    dispatch({
      type: 'DATA_FILES_TOGGLE_MODAL',
      payload: {
        operation: 'projectDescription',
        props: { title, description },
      },
    });
  };

  const columns = [
    {
      Header: `Request Title`,
      accessor: 'title',
      Cell: (el) => (
        <Link
          className="data-files-nav-link"
          to={`/workbench/data/tapis/projects/${rootSystem}/${el.row.original.id}`}
        >
          {el.value}
        </Link>
      ),
    },
    {
      Header: 'Requested Date',
      accessor: 'updated',
      Cell: (el) => (
        <span>{el.value ? formatDate(new Date(el.value)) : ''}</span>
      ),
    },
    {
      Header: 'Principal Investigator',
      accessor: 'authors',
      Cell: (el) => (
        <span>
          {el.value?.length > 0
            ? `${el.value[0].first_name} ${el.value[0].last_name}`
            : ''}
        </span>
      ),
    },
    {
      Header: 'Description',
      accessor: 'description',
      Cell: (el) => {
        return (
          <Button
            type="link"
            onClick={() =>
              createProjectDescriptionModal(el.row.original.title, el.value)
            }
          >
            View Description
          </Button>
        );
      },
    },
    {
      Header: 'Keywords',
      accessor: 'keywords',
    },
  ];

  const noDataText = query.query_string
    ? `No Projects match your search term.`
    : `You don't have any requests to review`;

  if (error) {
    return (
      <div className={styles['root-placeholder']}>
        <SectionMessage type="error">
          There was a problem retrieving your {sharedWorkspacesDisplayName}.
        </SectionMessage>
      </div>
    );
  }

  return (
    <SectionTableWrapper
      className={`${styles['root']}`}
      contentShouldScroll
      manualContent
    >
      <Searchbar
        api="tapis"
        scheme="projects"
        sectionName="Projects"
        resultCount={projects.length}
        infiniteScroll
      />
      <div className="o-flex-item-table-wrap">
        <InfiniteScrollTable
          tableColumns={columns}
          tableData={projects}
          onInfiniteScroll={infiniteScrollCallback}
          isLoading={loading}
          noDataText={noDataText}
          className="review-projects-listing"
        />
      </div>
    </SectionTableWrapper>
  );
};

export default DataFilesReviewProjectList;
