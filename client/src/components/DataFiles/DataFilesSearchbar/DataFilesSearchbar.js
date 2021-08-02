import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from 'reactstrap';
import queryString from 'query-string';
import { Icon, DropdownSelector } from '_common';
import { findSystemDisplayName } from 'utils/systems';
import { useSelector } from 'react-redux';
import fileTypes from './FileTypes';

import './DataFilesSearchbar.module.css';

const DataFilesSearchbar = ({
  api,
  scheme,
  system,
  setFilterType,
  filterType,
  resultCount,
  className,
  publicData
}) => {
  const disabled = useSelector(
    state =>
      state.files.loading.FilesListing === true ||
      state.files.error.FilesListing !== false
  );
  const systemList = useSelector(state => state.systems.storage.configuration);
  const [query, setQuery] = useState('');
  const history = useHistory();
  const hasQuery = queryString.parse(useLocation().search).query_string;
  const location = useLocation();
  const sectionName =
    scheme === 'projects'
      ? 'Workspace'
      : findSystemDisplayName(systemList, system);

  const routeSearch = () => {
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';
    if (publicData) {
      history.push(`/public-data/${api}/${scheme}/${system}/${qs}`);
      return;
    }
    history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}`);
  };

  // Reset form field on route change
  useEffect(() => {
    !hasQuery && setQuery('');
  }, [hasQuery, location]);

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
    } else {
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
          onChange={onChange}
          value={query}
          name="query"
          aria-label={`Search (in ${sectionName})`}
          styleName="input"
          className="form-control"
          placeholder={`Search in ${sectionName}`}
          data-testid="input"
          autoComplete="off"
          disabled={disabled}
        />
        {hasQuery && (
          <div aria-label="Summary of Search Results" styleName="results">
            {resultCount} Results Found for <span>{hasQuery}</span>
          </div>
        )}
      </div>
      <DropdownSelector
        onChange={e => setFilterType(e.target.value)}
        value={filterType}
      >
        <option>All Types</option>
        {fileTypes.map(item => (
          <option key={`fileTypeFilter${item.type}`}>{item.type}</option>
        ))}
      </DropdownSelector>
      {hasQuery && (
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
  publicData: PropTypes.bool
};
DataFilesSearchbar.defaultProps = {
  filterType: 'All Types',
  className: '',
  publicData: false,
  resultCount: 0
};

export default DataFilesSearchbar;
