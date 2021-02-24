import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { Icon } from '_common';
import { useDispatch } from 'react-redux';

import './OnboardingAdminSearchbar.module.scss';

const OnboardingAdminSearchbar = ({ className, disabled }) => {
  const [query, setQuery] = useState('');

  const onSubmit = e => {
    // do search
    e.preventDefault();
  };
  const onClear = e => {
    e.preventDefault();
    // clear search
  };
  const onChange = e => {
    // do search
  };
  const hasQuery = query.length > 0;

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
