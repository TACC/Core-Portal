import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import queryString from 'query-string';
import './DataFilesSearchbar.module.css';

const DataFilesSearchbar = ({ api, scheme, system, className }) => {
  const [query, setQuery] = useState('');
  const [prevQuery, setPrevQuery] = useState('');
  const history = useHistory();
  const resultCount = 0; // ???: How to increment this?
  const sectionName = 'My Data';
  const resultSummary = resultCount
    ? `${resultCount} Results Found for ${prevQuery}`
    : '';

  const routeSearch = () => {
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';

    setPrevQuery(query);

    history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}`);
  };
  const emptySearch = () => {
    setQuery('');
    setPrevQuery(query);

    // ???: How to empty the search?
  };

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
      data-testid="form"
      className={className}
      styleName="container"
      onSubmit={onSubmit}
    >
      <fieldset className="input-group" styleName="query-fieldset">
        <div className="input-group-prepend">
          <Button onClick={routeSearch} styleName="submit-button">
            <FontAwesomeIcon
              icon={faSearch}
              color="#707070"
              styleName="button__icon"
            />
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
      <fieldset styleName="summary-fieldset">
        <output
          name="results"
          aria-label="Summary of Search Results"
          styleName="output"
        >
          {resultSummary}
        </output>
      </fieldset>
      {/* FP-505: Implement Filter Dropdown */}
      <fieldset styleName="filter-fieldset">[filter dropdown]</fieldset>
      <Button
        type="reset"
        color="link"
        styleName="clear-button"
        onClick={onClear}
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
  /** Additional className for the root element */
  className: PropTypes.string
};
DataFilesSearchbar.defaultProps = {
  className: ''
};

export default DataFilesSearchbar;
