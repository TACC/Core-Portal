import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from 'reactstrap';
import queryString from 'query-string';
import { Icon } from '_common';
import { findSystemDisplayName } from 'utils/systems';
import { useSelector } from 'react-redux';

import './DataFilesSearchbar.module.css';

const DataFilesSearchbar = ({ api, scheme, system, className }) => {
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
    history.push(`/workbench/data/${api}/${scheme}/${system}/`);
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
      </div>
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
  /** Additional `className` (or transpiled `styleName`) for the root element */
  className: PropTypes.string
};
DataFilesSearchbar.defaultProps = {
  className: ''
};

export default DataFilesSearchbar;
