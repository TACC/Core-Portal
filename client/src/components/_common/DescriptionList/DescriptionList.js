import React from 'react';
import PropTypes from 'prop-types';

import './DescriptionList.module.css';

export const DIRECTIONS = ['', 'vertical', 'horizontal'];
export const DEFAULT_DIRECTION = 'vertical';
export const DENSITIES = ['', 'compact', 'default'];
export const DEFAULT_DENSITY = 'default';

const DescriptionList = ({ className, data, density, direction }) => {
  const modifierClasses = [];
  modifierClasses.push(direction === 'horizontal' ? 'is-horz' : 'is-vert');
  modifierClasses.push(density === 'compact' ? 'is-narrow' : 'is-wide');
  const containerStyleNames = ['container', ...modifierClasses].join(' ');

  return (
    <dl
      styleName={containerStyleNames}
      className={className}
      data-testid="list"
    >
      {Object.keys(data).map(key => (
        <React.Fragment key={key}>
          <dt styleName="key" data-testid="key">
            {key}
          </dt>
          <dd styleName="value" data-testid="value">
            {data[key]}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
};
DescriptionList.propTypes = {
  /** Additional className for the root element */
  className: PropTypes.string,
  /** Selector type */
  /* FAQ: ESLint prevents `PropTypes.object`, but we want to support anything */
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
  /** Layout density */
  density: PropTypes.oneOf(DENSITIES),
  /** Layout direction */
  direction: PropTypes.oneOf(DIRECTIONS)
};
DescriptionList.defaultProps = {
  className: '',
  density: DEFAULT_DENSITY,
  direction: DEFAULT_DIRECTION
};

export default DescriptionList;
