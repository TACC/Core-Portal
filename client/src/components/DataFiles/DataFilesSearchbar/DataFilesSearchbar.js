import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from 'reactstrap';
import queryString from 'query-string';
import { Icon } from '_common';

import './DataFilesSearchbar.module.css';

const DataFilesSearchbar = ({ api, scheme, system, className }) => {
  const [query, setQuery] = useState('');
  const history = useHistory();
  const hasQuery = queryString.parse(useLocation().search).query_string;
  const sectionName = 'My Data';

  const routeSearch = () => {
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';

    history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}`);
  };

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
          aria-label={`Search (in ${sectionName})`}
          styleName="input"
          className="form-control"
          placeholder={`Search in ${sectionName}`}
          data-testid="input"
          autoComplete="off"
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
