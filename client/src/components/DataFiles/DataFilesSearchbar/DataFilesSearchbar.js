import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Button } from 'reactstrap';
import queryString from 'query-string';
import { Icon } from '_common';
// FP-563: Support count in status message
// import DataFilesSearchbarStatus from './DataFilesSearchbarStatus';

import './DataFilesSearchbar.module.css';

const DataFilesSearchbar = ({ api, scheme, system, className }) => {
  const [query, setQuery] = useState('');
  const history = useHistory();
  const sectionName = 'My Data';

  const routeSearch = () => {
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';

    history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}`);
  };
  const emptySearch = () => {};

  const onSubmit = e => {
    routeSearch();
    e.preventDefault();
  };
  const onClear = e => {
    emptySearch();
    e.preventDefault();
  };
  const onChange = e => setQuery(e.target.value);

  return (
    <form
      aria-label={`${sectionName} Search`}
      className={className}
      styleName="container"
      onSubmit={onSubmit}
    >
      <fieldset className="input-group" styleName="query-fieldset">
        <div className="input-group-prepend">
          <Button type="submit" styleName="submit-button">
            <Icon name="search" styleName="button__icon" />
            <span styleName="button__text">Search</span>
          </Button>
        </div>
        <input
          type="search"
          onChange={onChange}
          value={query}
          name="query"
          aria-label={`Search (within ${sectionName})`}
          styleName="input"
          className="form-control"
          placeholder={`Search within ${sectionName}`}
          data-testid="input"
        />
      </fieldset>
      {/* FP-563: Support count in status message */}
      {/* <fieldset styleName="summary-fieldset">
        <output
          name="results"
          aria-label="Summary of Search Results"
          styleName="output"
        >
          <DataFilesSearchbarStatus count={resultCount} query={prevQuery} />
        </output>
      </fieldset> */}
      {/* FP-505: Implement Filter Dropdown */}
      <fieldset styleName="filter-fieldset">
        <select>
          <option>No filter options, yet</option>
        </select>
      </fieldset>
      <Button
        type="reset"
        color="link"
        styleName="clear-button"
        onClick={onClear}
        data-testid="reset"
      >
        Back to All Files
      </Button>
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
