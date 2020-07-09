import React, { useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import queryString from 'query-string';
import './DataFilesSearchbar.scss';

const DataFilesSearchbar = ({ api, scheme, system }) => {
  const [query, setQuery] = useState('');
  const history = useHistory();

  const routeSearch = () => {
    const qs = query
      ? `?${queryString.stringify({ query_string: query })}`
      : '';
    history.push(
      `/workbench/data/${api}/${scheme}/${system}/${qs}`
    );
  };
  const onKeyDown = e => {
    if (e.key === 'Enter') {
      routeSearch();
    }
  };
  const onChange = e => setQuery(e.target.value);
  return (
    <div className="input-group data-files-searchbar-input-group">
      <div className="input-group-prepend">
        <Button className="data-files-toolbar-button" onClick={routeSearch}>
          {' '}
          <FontAwesomeIcon icon={faSearch} color="#707070" />
          <span className="toolbar-button-text">Search</span>
        </Button>
      </div>
      <input
        onChange={onChange}
        value={query}
        aria-label="search-input"
        className="form-control data-files-searchbar-input"
        placeholder="Search in My Data"
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

export default DataFilesSearchbar;
