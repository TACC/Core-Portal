import React from 'react';
import UIPatternsMessage from './UIPatternsMessage';
import UIPatternsDropdownSelector from './UIPatternsDropdownSelector';
import './UIPatterns.module.scss';

function UIPatterns() {
  return (
    <div styleName="container">
      <div styleName="header">
        <h5>UI Patterns</h5>
      </div>
      <div styleName="items">
        <div styleName="grid-item">
          <div styleName="item-header">
            <h6>Message</h6>
          </div>
          <UIPatternsMessage />
        </div>
        <div styleName="grid-item">
          <div styleName="item-header">
            <h6>DropdownSelector</h6>
          </div>
          <UIPatternsDropdownSelector />
        </div>
      </div>
    </div>
  );
}

export default UIPatterns;
