import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Button } from 'reactstrap';
import queryString from 'query-string';
import { Icon, DropdownSelector } from '_common';
// FP-563: Support count in status message
// import DataFilesSearchbarStatus from './DataFilesSearchbarStatus';

import './DataFilesSearchbar.module.css';

const DataFilesSearchbar = ({ api, scheme, system, className }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const history = useHistory();
  const sectionName = 'My Data';

  const routeSearch = () => {
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';

    // !!!: How to filter?
    history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}`);
    console.log({ filter });
    // history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}/${filter}`);
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
  const onFilter = e => setFilter(e.target.value);

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
        <DropdownSelector type="single" onChange={onFilter}>
          <option value="any">All Types</option>
          <option value="audio">Audio</option>
          <option value="code">Code</option>
          <option value="doc">Documents</option>
          <option value="folder">Folders</option>
          <option value="image">Images</option>
          <option value="jupyter">Jupyter Notebook</option>
          <option value="pdf">PDF</option>
          <option value="presentation">Presentation</option>
          <option value="spreadsheet">Spreadsheet</option>
          <option value="shape">Shape File</option>
          <option value="zip">ZIP</option>
        </DropdownSelector>
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
