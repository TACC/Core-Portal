import React from 'react';
import PropTypes from 'prop-types';

import './DescriptionList.module.css';

export const LAYOUTS = ['', 'block', 'inline'];
export const DEFAULT_LAYOUT = 'block';

const DescriptionList = ({ className, data, layout }) => {
  const isInline = layout === 'inline';
  const modifierClass = isInline ? 'is-inline' : 'is-block';

  return (
    <dl
      styleName={`container ${modifierClass}`}
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
  /* FAQ: ESLint prevents `PropTypes.object`, so convert values to strings */
  data: PropTypes.objectOf(PropTypes.string).isRequired,
  /** Selector type */
  layout: PropTypes.oneOf(LAYOUTS)
};
DescriptionList.defaultProps = {
  className: '',
  layout: DEFAULT_LAYOUT
};

export default DescriptionList;
