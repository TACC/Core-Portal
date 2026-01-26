import React from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';

import styles from './DescriptionList.module.scss';

export const DIRECTION_CLASS_MAP = {
  vertical: 'is-vert',
  horizontal: 'is-horz',
};
export const DEFAULT_DIRECTION = 'vertical';
export const DIRECTIONS = ['', ...Object.keys(DIRECTION_CLASS_MAP)];

export const DENSITY_CLASS_MAP = {
  compact: 'is-narrow',
  default: 'is-wide',
};
export const DEFAULT_DENSITY = 'default';
export const DENSITIES = ['', ...Object.keys(DENSITY_CLASS_MAP)];

const DescriptionList = ({ className, data, density, direction }) => {
  const modifierClasses = [];
  modifierClasses.push(DENSITY_CLASS_MAP[density || DEFAULT_DENSITY]);
  modifierClasses.push(DIRECTION_CLASS_MAP[direction || DEFAULT_DIRECTION]);
  const containerStyleNames = ['container', ...modifierClasses]
    .map((s) => styles[s])
    .join(' ');

  const shouldTruncateValues =
    (direction === 'vertical' && density === 'compact') ||
    (direction === 'horizontal' && density === 'default');
  const valueClassName = `${styles.value} ${
    shouldTruncateValues ? 'value-truncated' : ''
  }`;

  const compareFn = (entry1, entry2) => {
    const [, val1] = entry1;
    const [, val2] = entry2;
    if ((val1._order ?? 0) < (val2._order ?? 0)) {
      return -1;
    }
    if ((val1._order ?? 0) > (val2._order ?? 0)) {
      return 1;
    }
    return 0;
  };

  return (
    <dl className={`${className} ${containerStyleNames}`} data-testid="list">
      {Object.entries(data)
        .sort(compareFn)
        .filter(([key, _]) => !key.startsWith('_'))
        .map(([key, value]) => (
          <React.Fragment key={key}>
            <dt className={styles.key} data-testid="key">
              {key}
            </dt>
            {Array.isArray(value) ? (
              value.map((val) => (
                <dd
                  className={valueClassName}
                  data-testid="value"
                  key={uuidv4()}
                >
                  {val}
                </dd>
              ))
            ) : (
              <dd className={valueClassName} data-testid="value">
                {value}
              </dd>
            )}
          </React.Fragment>
        ))}
    </dl>
  );
};
DescriptionList.propTypes = {
  /** Additional className for the root element */
  className: PropTypes.string,
  /** Selector type */
  /* FAQ: We can support any values, even a component */
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
  /** Layout density */
  density: PropTypes.oneOf(DENSITIES),
  /** Layout direction */
  direction: PropTypes.oneOf(DIRECTIONS),
};
DescriptionList.defaultProps = {
  className: '',
  density: DEFAULT_DENSITY,
  direction: DEFAULT_DIRECTION,
};

export default DescriptionList;
