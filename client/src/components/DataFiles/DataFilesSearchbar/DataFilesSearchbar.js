import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from 'reactstrap';
import queryString from 'query-string';
import { Icon, DropdownSelector } from '_common';
import { findSystemDisplayName } from 'utils/systems';
import { useSelector } from 'react-redux';
import fileTypes from './FileTypes';

import './DataFilesSearchbar.module.scss';

const DataFilesSearchbar = ({
  api,
  scheme,
  system,
  setFilterType,
  filterType,
  resultCount,
  className,
  publicData,
  siteSearch,
  disabled
}) => {
  const systemList = useSelector(state => state.systems.storage.configuration);
  const urlQueryParam = queryString.parse(window.location.search).query_string;
  const [query, setQuery] = useState(urlQueryParam);
  const history = useHistory();
  const hasQuery = queryString.parse(useLocation().search).query_string;
  const location = useLocation();

  let sectionName;
  if (siteSearch) {
    sectionName = 'Site';
  } else if (scheme === 'projects') {
    sectionName = 'Workspace';
  } else {
    sectionName = findSystemDisplayName(systemList, system);
  }

  const routeSearch = () => {
    // Site Search query
    if (siteSearch) {
      const baseUrl = scheme ? `/search/${scheme}` : '/search';
      const qs = query
        ? `?${queryString.stringify({ query_string: query, page: 1 })}`
        : '';
      history.push(`${baseUrl}/${qs}`);

      window.dispatchEvent(new Event('portal.search'));
      return;
    }

    // All other queries
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';
    if (publicData) {
      history.push(`/public-data/${api}/${scheme}/${system}/${qs}`);
    } else {
      history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}`);
    }
  };

  // Reset form field on route change
  useEffect(() => {
    !hasQuery && !siteSearch && setQuery('');
  }, [hasQuery, location, siteSearch]);

  const onSubmit = e => {
    routeSearch();
    e.preventDefault();
  };
  const onClear = e => {
    e.preventDefault();
    setQuery('');
    setFilterType('All Types');
    if (publicData) {
      history.push(`/public-data/${api}/${scheme}/${system}/`);
    } else if (!siteSearch) {
      history.push(`/workbench/data/${api}/${scheme}/${system}/`);
    }
  };
  const onChange = e => setQuery(e.target.value);

  return (
    <form
      aria-label={`${sectionName} Search`}
      className={className}
      styleName="container"
      onSubmit={onSubmit}
    >
      <div className="input-group" styleName="query-fieldset">
        <div className="input-group-prepend">
          <Button type="submit" styleName="submit-button" disabled={disabled}>
            <Icon name="search" styleName="button__icon" />
            <span styleName="button__text">Search</span>
          </Button>
        </div>
        <input
          type="search"
          minLength="3"
          onInput={e => e.target.setCustomvalidity('')}
          onInvalid={e =>
            e.target.setCustomvalidity(
              'Include at least 3 characters in your search.'
            )
          }
          onChange={onChange}
          value={query || ''}
          name="query"
          aria-label={`Search ${sectionName}`}
          styleName="input"
          className="form-control"
          placeholder={`Search ${sectionName}`}
          data-testid="input"
          autoComplete="off"
          disabled={disabled}
        />
      </div>
      {scheme !== 'cms' && (
        <div styleName="file-filter">
          <span>File Type:</span>
          <DropdownSelector
            onChange={e => setFilterType(e.target.value)}
            value={filterType}
            disabled={disabled}
          >
            <option>All Types</option>
            {fileTypes.map(item => (
              <option key={`fileTypeFilter${item.type}`}>{item.type}</option>
            ))}
          </DropdownSelector>
        </div>
      )}
      {hasQuery && !siteSearch && (
        <div aria-label="Summary of Search Results" styleName="results">
          {resultCount} Results Found for <span>{hasQuery}</span>
        </div>
      )}
      {((hasQuery && !siteSearch) ||
        (filterType !== 'All Types' && scheme !== 'cms')) && (
        <Button
          type="reset"
          color="link"
          styleName="clear-button"
          onClick={onClear}
          data-testid="reset"
        >
          Back to All Files
        </Button>
      )}
    </form>
  );
};
DataFilesSearchbar.propTypes = {
  /* API endpoint values */
  api: PropTypes.string.isRequired,
  scheme: PropTypes.string.isRequired,
  system: PropTypes.string.isRequired,
  setFilterType: PropTypes.func.isRequired,
  filterType: PropTypes.string,
  resultCount: PropTypes.number,
  /** Additional `className` (or transpiled `styleName`) for the root element */
  className: PropTypes.string,
  publicData: PropTypes.bool,
  siteSearch: PropTypes.bool,
  disabled: PropTypes.bool
};
DataFilesSearchbar.defaultProps = {
  filterType: 'All Types',
  className: '',
  publicData: false,
  resultCount: 0,
  siteSearch: false,
  disabled: false
};

export default DataFilesSearchbar;
