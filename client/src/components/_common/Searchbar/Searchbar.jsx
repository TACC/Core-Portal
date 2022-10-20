import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { Button, DropdownSelector } from '_common';
import { useSystemDisplayName } from 'hooks/datafiles';
import styles from './Searchbar.module.scss';

const Searchbar = ({
    api, 
    scheme, 
    system, 
    resultCount, 
    dataType,
    filterTypes, 
    infiniteScroll,
    className, 
    siteSearch, 
    disabled
}) => {
    const urlQueryParam = queryString.parse(window.location.search).query_string;
    const [query, setQuery] = useState(urlQueryParam);
    const history = useHistory();
    const location = useLocation();
    const { query_string: hasQuery, filter: filterType } = queryString.parse(
      location.search
    );

    const displayName = useSystemDisplayName({ system, scheme });
    let sectionName;
  
    if (siteSearch) {
      sectionName = 'Site';
    } else if (scheme === 'projects') {
      sectionName = 'Workspace';
    } else if (scheme === 'jobs') {
      sectionName = 'Jobs';
    } else {
      sectionName = displayName;
    }

    const applyFilter = (newFilter) => {
        const prevQuery = queryString.parse(location.search);
        const updatedQuery = queryString.stringify({
          ...prevQuery,
          filter: newFilter || undefined,
          page: !infiniteScroll ? 1 : undefined,
        });
        history.push(`${location.pathname}?${updatedQuery}`);
    };

    const routeSearch = () => {
        const prevQuery = queryString.parse(location.search);
        const updatedQuery = queryString.stringify({
          ...prevQuery,
          query_string: query || undefined,
          page: !infiniteScroll ? 1 : undefined,
        });
        history.push(`${location.pathname}?${updatedQuery}`);
    
        if (siteSearch) window.dispatchEvent(new Event('portal.search'));
      };

      const onSubmit = (e) => {
        routeSearch();
        e.preventDefault();
      };

      const onClear = (e) => {
        e.preventDefault();
        if (filterType && filterType !== 'All Types') {
            applyFilter(undefined)
        }
        setQuery('');
        history.push(location.pathname);
      };

      const onChange = (e) => setQuery(e.target.value);

      return (
        <form
            aria-label={`${sectionName} Search`}
            className={`${className} ${styles['container']}`}
            onSubmit={onSubmit}
        >
            <div className={`input-group ${styles['query-fieldset']}`}>
                <div className="input-group-prepend">
                <Button
                    attr="submit"
                    type="secondary"
                    disabled={disabled}
                    size="medium"
                    iconNameBefore="search"
                >
                    Search
                </Button>
                </div>
                <input
                type="search"
                minLength="3"
                onInput={(e) => e.target.setCustomValidity('')}
                onInvalid={(e) =>
                    e.target.setCustomValidity(
                    'Include at least 3 characters in your search.'
                    )
                }
                onChange={onChange}
                value={query || ''}
                name="query"
                aria-label={`Search ${sectionName}`}
                className={`form-control ${styles['input']}`}
                placeholder={`Search ${sectionName}`}
                data-testid="input"
                autoComplete="off"
                disabled={disabled}
                />
            </div>

            {filterTypes && api === 'tapis' && (
            <div className={styles['file-filter']}>
            <span>Filter:</span>
            <DropdownSelector
                onChange={(e) => applyFilter(e.target.value)}
                value={filterType ?? ''}
                disabled={disabled}
            >
                <option value="">All Types</option>
                {filterTypes.map((item) => (
                <option key={`fileTypeFilter${item}`}>{item}</option>
                ))}
            </DropdownSelector>
            </div>
            )}
            {((hasQuery && !siteSearch) ||
                (filterType && filterType !== 'All Types')) && (
                <div
                aria-label="Summary of Search Results"
                className={`${styles.results} ${disabled ? styles.hidden : ''}`}
                data-testid="summary-of-search-results"
                >
                {resultCount} results in {sectionName}
                </div>
            )}
            {((hasQuery && !siteSearch) ||
                (filterType && filterType !== 'All Types' && filterTypes)) && (
                <Button attr="reset" type="link" onClick={onClear}>
                Back to All {dataType ? dataType : 'Results'}
                </Button>
            )}
        </form>
      );

}


Searchbar.propTypes = {
    /* API endpoint values */
    api: PropTypes.string.isRequired,
    scheme: PropTypes.string.isRequired,
    system: PropTypes.string.isRequired,
    resultCount: PropTypes.number,
    filterTypes: PropTypes.arrayOf(PropTypes.string),
    infiniteScroll: PropTypes.bool,
    dataType: PropTypes.string.isRequired,
    /** Additional className(s) for the root element */
    className: PropTypes.string,
    siteSearch: PropTypes.bool,
    disabled: PropTypes.bool,
  };

Searchbar.defaultProps = {
    className: '',
    resultCount: 0,
    siteSearch: false,
    disabled: false,
    infiniteScroll: true,
    dataType: ''
};

export default Searchbar;