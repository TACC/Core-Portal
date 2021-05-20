import React, { useEffect, useLayoutEffect } from 'react';
import queryStringParser from 'query-string';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import SiteSearchSidebar from './SiteSearchSidebar/SiteSearchSidebar';
import SiteSearchListing from './SiteSearchListing/SiteSearchListing';

const SiteSearch = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { filter } = useParams();
  const history = useHistory();
  // eslint-disable-next-line camelcase
  const { query_string, page } = queryStringParser.parse(location.search);

  const { loading, error, completed, results } = useSelector(
    state => state.siteSearch
  );
  const { user } = useSelector(state => state.authenticatedUser);

  /* eslint-disable camelcase */
  useLayoutEffect(() => {
    dispatch({ type: 'FETCH_SITE_SEARCH', payload: { page, query_string } });
  }, [query_string, page]);
  /* eslint-disable camelcase */

  const FILTER_PRIORITY = ['cms', 'community', 'public'];
  useEffect(() => {
    if (completed && !filter) {
      const activeFilter = FILTER_PRIORITY.find(f => results[f].count > 0);
      history.push(
        `/search/${activeFilter || FILTER_PRIORITY[0]}/${location.search}`
      );
    }
  }, [completed, results, location.search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div className="col-md-2">
        {/* eslint-disable-next-line camelcase */}
        <SiteSearchSidebar
          queryString={query_string}
          schemes={Object.keys(results).filter(key => results[key].include)}
          authenticated={Boolean(user)}
          results={results}
        />
      </div>
      <div className="col-md-10" style={{ display: 'flex' }}>
        <SiteSearchListing
          loading={loading}
          error={error}
          filter={filter || 'cms'}
          results={results[filter] || results[FILTER_PRIORITY[0]]}
        />
      </div>
    </div>
  );
};

export default SiteSearch;
