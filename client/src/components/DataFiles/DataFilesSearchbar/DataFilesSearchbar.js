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
  const resultCount = 1; // ???: How to increment this?
  const sectionName = 'My Data';

  const routeSearch = () => {
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';

    setPrevQuery(query);

    history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}`);
  };
  const searchClear = () => {
    setQuery('');
    setPrevQuery(query);

    // ???: How to clear search?
  };

  const onSubmit = e => {
    // TEMPORARY: Testing form submission
    // console.log('Search query (via `FormData`): ', (new FormData(e.currentTarget)).get('query'));
    // console.log('Search query (via `query``): ', query);

    routeSearch();
    e.preventDefault();
  };
  const onClear = e => {
    searchClear();
    e.preventDefault();
  };
  const onChange = e => setQuery(e.target.value);

  const resultSummary = `${resultCount} Results Found for ${prevQuery}`;
  let resultMessage;
  if (resultCount) {
    resultMessage = (
      <output
        value={resultSummary}
        name="query"
        aria-label="Summary of Search Results"
        styleName="output"
      >
        {resultSummary}
      </output>
    );
  }

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
          value={resultSummary}
          name="query"
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
  /** Additional className for the root element */
  className: PropTypes.string
};
DataFilesSearchbar.defaultProps = {
  className: ''
};

export default DataFilesSearchbar;
