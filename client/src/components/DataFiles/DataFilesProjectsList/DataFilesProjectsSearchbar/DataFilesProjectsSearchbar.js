import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from 'reactstrap';
import queryString from 'query-string';
import { Icon } from '_common';

import './DataFilesProjectsSearchbar.module.css';

const DataFilesProjectsSearchbar = () => {
  const history = useHistory();
  const [query, setQuery] = useState('');

  const baseUrl = '/workbench/data/tapis/projects';
  const routeSearch = () => {
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';
    history.push(`${baseUrl}/${qs}`);
  };

  const onSubmit = e => {
    routeSearch();
    e.preventDefault();
  };

  const onChange = e => setQuery(e.target.value);

  return (
    <form aria-label="search" styleName="container" onSubmit={onSubmit}>
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
          aria-label="Search"
          styleName="input"
          className="form-control"
          placeholder="Search"
          data-testid="input"
          autoComplete="off"
        />
      </div>
    </form>
  );
};

export default DataFilesProjectsSearchbar;
