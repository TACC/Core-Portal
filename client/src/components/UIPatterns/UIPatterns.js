import React from 'react';
import UIPatternsMessages from './UIPatternsMessages';
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
            <h6>Messages</h6>
          </div>
          <UIPatternsMessages />
        </div>
      </div>
    </div>
  );
}

export default UIPatterns;
