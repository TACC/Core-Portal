import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import queryString from 'query-string';
import { createTemplateFunction } from 'utils/taggedTemplates';
import DataFilesSearchbarStatus from './DataFilesSearchbarStatus';
import './DataFilesSearchbar.module.css';

export const createMessage = createTemplateFunction`${'count'} Results Found for ${'query'}`;

const DataFilesSearchbar = ({ api, scheme, system, className }) => {
  const [query, setQuery] = useState('');
  const [prevQuery, setPrevQuery] = useState('');
  const [resultCount, setResultCount] = useState(0);
  const history = useHistory();
  const sectionName = 'My Data';

  const routeSearch = () => {
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';

    // No results found during search (status will reflect this)
    setResultCount(0);

    setPrevQuery(query);
    setResultCount(100); // !!!: By what value to increment this?

    history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}`);
  };
  const emptySearch = () => {
    setQuery('');
    setPrevQuery(query);
    setResultCount(0);

    // !!!: How to empty the search?
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
      aria-label={`${sectionName} Search`}
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
          <DataFilesSearchbarStatus count={resultCount} query={prevQuery} />
        </output>
      </fieldset>
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
  /** Additional className for the root element */
  className: PropTypes.string
};
DataFilesSearchbar.defaultProps = {
  className: ''
};

export default DataFilesSearchbar;
