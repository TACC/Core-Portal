import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { Icon } from '_common';
import { useDispatch } from 'react-redux';

import './OnboardingAdminSearchbar.module.scss';

const OnboardingAdminSearchbar = ({ className, disabled }) => {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const dispatch = useDispatch();

  const onSubmit = e => {
    e.preventDefault();
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_LIST',
      payload: {
        limit: 10,
        offset: 0,
        q: query
      }
    });
    setSearched(true);
  };
  const onClear = e => {
    e.preventDefault();
    setQuery('');
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_LIST',
      payload: {
        limit: 10,
        offset: 0
      }
    });
    setSearched(false);
  };
  const onChange = e => {
    setQuery(e.target.value);
    if (!e.target.value && searched) {
      onClear(e);
    }
  };

  return (
    <form
      aria-label="Search"
      className={className}
      styleName="container"
      onSubmit={onSubmit}
    >
      <div className="input-group" styleName="query-fieldset">
        <div className="input-group-prepend">
          <Button type="submit" styleName="submit-button" disabled={disabled}>
            <Icon name="search" styleName="button__icon" />
            <span styleName="button__text">Search</span>
          </Button>
        </div>
        <input
          type="search"
          onChange={onChange}
          value={query}
          name="query"
          aria-label="Search for users"
          styleName="input"
          className="form-control"
          placeholder="Search for users"
          data-testid="input"
          autoComplete="off"
          disabled={disabled}
        />
      </div>
    </form>
  );
};

OnboardingAdminSearchbar.propTypes = {
  /** Additional `className` (or transpiled `styleName`) for the root element */
  className: PropTypes.string,
  disabled: PropTypes.bool
};
OnboardingAdminSearchbar.defaultProps = {
  className: '',
  disabled: false
};

export default OnboardingAdminSearchbar;
