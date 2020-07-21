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

    history.push(`/workbench/data/${api}/${scheme}/${system}/${qs}`);
  };
  const onSubmit = e => {
    // TEMPORARY: Testing form submission
    // console.log('Search query (via `FormData`): ', (new FormData(e.currentTarget)).get('query'));
    // console.log('Search query (via `query``): ', query);

    routeSearch();
    e.preventDefault();
  };
  const onChange = e => setQuery(e.target.value);

  return (
    <form
      className="input-group data-files-searchbar-input-group"
      onSubmit={onSubmit}
    >
      <div className="input-group-prepend">
        <Button className="data-files-toolbar-button" onClick={routeSearch}>
          {' '}
          <FontAwesomeIcon icon={faSearch} color="#707070" />
          <span className="toolbar-button-text">Search</span>
        </Button>
      </div>
      <input
        type="search"
        onChange={onChange}
        value={query}
        name="query"
        aria-label="search-input"
        className="form-control data-files-searchbar-input"
        placeholder="Search within My Data"
      />
    </form>
  );
};

export default DataFilesSearchbar;
