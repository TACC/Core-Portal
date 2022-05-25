import React, { useEffect } from 'react';
import queryStringParser from 'query-string';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import SiteSearchSidebar from './SiteSearchSidebar/SiteSearchSidebar';
import SiteSearchListing from './SiteSearchListing/SiteSearchListing';

export const SiteSearchComponent = ({ filterPriorityList }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { filter } = useParams();
  const history = useHistory();
  const {
    // eslint-disable-next-line camelcase
    query_string,
    page,
    filter: filetypeFilter,
  } = queryStringParser.parse(location.search);

  const { loading, error, completed, results } = useSelector(
    (state) => state.siteSearch
  );
  const { user } = useSelector((state) => state.authenticatedUser);

  /* eslint-disable camelcase */
  useEffect(() => {
    dispatch({
      type: 'FETCH_SITE_SEARCH',
      payload: { page, query_string, filter: filetypeFilter },
    });
  }, [query_string, page, filetypeFilter]);
  /* eslint-disable camelcase */

  useEffect(() => {
    if (completed && !filter) {
      const activeFilter = filterPriorityList.find((f) => results[f].count > 0);
      history.push(
        `/search/${activeFilter || filterPriorityList[0]}/${location.search}`
      );
    }
  }, [completed, results, location.search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div className="col-md-2">
        <SiteSearchSidebar
          queryString={query_string}
          schemes={Object.keys(results).filter((key) => results[key].include)}
          authenticated={Boolean(user)}
          searching={loading}
          results={results}
        />
      </div>
      <div className="col-md-8" style={{ display: 'flex' }}>
        <SiteSearchListing
          loading={loading}
          error={error}
          filter={filter || 'cms'}
          results={results[filter] || results[filterPriorityList[0]]}
        />
      </div>
      <div className="col-md-2" />
    </div>
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
