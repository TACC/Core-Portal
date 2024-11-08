import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import queryStringParser from 'query-string';
import {
  InfiniteScrollTable,
  SectionMessage,
  SectionTableWrapper,
} from '_common';
import styles from './DataFilesPublicationsList.module.scss';
import './DataFilesPublicationsList.scss';
import Searchbar from '_common/Searchbar';
import { formatDate, formatDateTimeFromValue } from 'utils/timeFormat';

const DataFilesPublicationsList = ({ rootSystem }) => {
  const { error, loading, publications } = useSelector(
    (state) => state.publications.listing
  );

  const query = queryStringParser.parse(useLocation().search);

  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );

  const selectedSystem = systems.find(
    (s) => s.scheme === 'projects' && s.publicationProject === true
  );

  const infiniteScrollCallback = useCallback(() => {});
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({
      type: 'PUBLICATIONS_GET_PUBLICATIONS',
      payload: {
        queryString: query.query_string,
      },
    });
  }, [dispatch, query.query_string]);

  const columns = [
    {
      Header: 'Publication Title',
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
      Header: 'Principal Investigator',
      accessor: 'authors',
      Cell: (el) => (
        <span>
          {el.value.length > 0
            ? `${el.value[0].first_name} ${el.value[0].last_name}`
            : ''}
        </span>
      ),
    },
    {
      Header: 'Keywords',
      accessor: 'keywords',
    },
    {
      Header: 'Publication Date',
      accessor: 'publication_date',
      Cell: (el) => (
        <span>{el.value ? formatDate(new Date(el.value)) : ''}</span>
      ),
    },
  ];

  const noDataText = query.query_string
    ? `No Publications match your search term.`
    : `No Publications available.`;

  if (error) {
    return (
      <div className={styles['root-placeholder']}>
        <SectionMessage type="error">
          There was a problem retrieving Publications.
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
        sectionName="Publications"
        resultCount={publications.length}
        infiniteScroll
      />
      <div className="o-flex-item-table-wrap">
        <InfiniteScrollTable
          tableColumns={columns}
          tableData={publications}
          onInfiniteScroll={infiniteScrollCallback}
          isLoading={loading}
          noDataText={noDataText}
          className="publications-listing"
        />
      </div>
    </SectionTableWrapper>
  );
};

export default DataFilesPublicationsList;
