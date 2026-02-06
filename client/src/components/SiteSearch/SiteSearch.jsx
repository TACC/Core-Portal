import React, { useEffect } from 'react';
import queryStringParser from 'query-string';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import SiteSearchSidebar from './SiteSearchSidebar/SiteSearchSidebar';
import SiteSearchListing from './SiteSearchListing/SiteSearchListing';
import styles from './SiteSearch.module.css';

import { Section } from '_common';

export const SiteSearchComponent = ({ filterPriorityList }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { filter } = useParams();
  const history = useHistory();
  const {
    query_string,
    page,
    filter: filetypeFilter,
  } = queryStringParser.parse(location.search);

  const { loading, error, completed, results } = useSelector(
    (state) => state.siteSearch
  );
  const { user } = useSelector((state) => state.authenticatedUser);

  useEffect(() => {
    dispatch({
      type: 'FETCH_SITE_SEARCH',
      payload: { page, query_string, filter: filetypeFilter },
    });
  }, [query_string, page, filetypeFilter]);

  useEffect(() => {
    if (completed && !filter) {
      const activeFilter = filterPriorityList.find((f) => results[f].count > 0);
      history.push(
        `/search/${activeFilter || filterPriorityList[0]}/${location.search}`
      );
    }
  }, [completed, results, location.search]);

  return (
    <Section
      className={styles['root']}
      content={
        <>
          <SiteSearchSidebar
            queryString={query_string}
            schemes={Object.keys(results).filter((key) => results[key].include)}
            authenticated={Boolean(user)}
            searching={loading}
            results={results}
          />

          <SiteSearchListing
            loading={loading}
            error={error}
            filter={filter || 'cms'}
            results={results[filter] || results[filterPriorityList[0]]}
          />
        </>
      }
    />
  );
};
SiteSearchComponent.propTypes = {
  filterPriorityList: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const SiteSearch = () => {
  const location = useLocation();
  const { filter } = useParams();
  const history = useHistory();
  const systems = useSelector((state) => state.systems.storage.configuration);

  const searchSystems = systems
    .filter((s) => s.siteSearchPriority !== undefined)
    .sort((a, b) => a.siteSearchPriority - b.siteSearchPriority)
    .map((s) => s.scheme);
  const filterPriorityList = ['cms'].concat(searchSystems);

  if (!filter || !filterPriorityList.includes(filter)) {
    history.push(`/search/${filterPriorityList[0]}/${location.search}`);
    return <></>;
  }

  return <SiteSearchComponent filterPriorityList={filterPriorityList} />;
};

export default SiteSearch;
