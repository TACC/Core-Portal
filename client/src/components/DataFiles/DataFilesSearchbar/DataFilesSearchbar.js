import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from 'reactstrap';
import queryString from 'query-string';
import { Icon, DropdownSelector } from '_common';
import { findSystemDisplayName } from 'utils/systems';
import { useSelector } from 'react-redux';
import './DataFilesSearchbar.module.scss';

const fileTypes = [
  'Audio',
  'Code',
  'Documents',
  'Folders',
  'Images',
  'Jupyter Notebook',
  'PDF',
  'Presentation',
  'Spreadsheet',
  'Shape File',
  'Text',
  'ZIP',
  '3D Visualization'
];

const DataFilesSearchbar = ({
  api,
  scheme,
  system,
  resultCount,
  className,
  siteSearch,
  disabled
}) => {
  const systemList = useSelector(state => state.systems.storage.configuration);
  const urlQueryParam = queryString.parse(window.location.search).query_string;
  const [query, setQuery] = useState(urlQueryParam);
  const history = useHistory();
  const location = useLocation();
  const { query_string: hasQuery, filter: filterType } = queryString.parse(
    location.search
  );

  let sectionName;
  if (siteSearch) {
    sectionName = 'Site';
  } else if (scheme === 'projects') {
    sectionName = 'Workspace';
  } else {
    sectionName = findSystemDisplayName(systemList, system);
  }

  const applyFilter = newFilter => {
    const prevQuery = queryString.parse(location.search);
    const updatedQuery = queryString.stringify({
      ...prevQuery,
      filter: newFilter || undefined,
      page: siteSearch ? 1 : undefined
    });
    history.push(`${location.pathname}?${updatedQuery}`);
  };

  const routeSearch = () => {
    // Site Search query
    const prevQuery = queryString.parse(location.search);
    const updatedQuery = queryString.stringify({
      ...prevQuery,
      query_string: query || undefined,
      page: siteSearch ? 1 : undefined
    });
    history.push(`${location.pathname}?${updatedQuery}`);

    if (siteSearch) window.dispatchEvent(new Event('portal.search'));
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
    if (!siteSearch) {
      setQuery('');
      history.push(location.pathname);
    } else applyFilter(undefined);
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
          onInput={e => e.target.setCustomValidity('')}
          onInvalid={e =>
            e.target.setCustomValidity(
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
      {scheme !== 'cms' && api === 'tapis' && (
        <div styleName="file-filter">
          <span>File Type:</span>
          <DropdownSelector
            onChange={e => applyFilter(e.target.value)}
            value={filterType ?? ''}
            disabled={disabled}
          >
            <option value="">All Types</option>
            {fileTypes.map(item => (
              <option key={`fileTypeFilter${item}`}>{item}</option>
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
        (filterType && filterType !== 'All Types' && scheme !== 'cms')) && (
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
  resultCount: PropTypes.number,
  /** Additional `className` (or transpiled `styleName`) for the root element */
  className: PropTypes.string,
  siteSearch: PropTypes.bool,
  disabled: PropTypes.bool
};
DataFilesSearchbar.defaultProps = {
  className: '',
  resultCount: 0,
  siteSearch: false,
  disabled: false
};

export default DataFilesSearchbar;
