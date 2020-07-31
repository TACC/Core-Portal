import React from 'react';
import UIPatternsMessages from './UIPatternsMessages';
import UIPatternsDescriptionList from './UIPatternsDescriptionList';
import './UIPatterns.module.scss';

function UIPatterns() {
  return (
    <div styleName="container">
      <div styleName="header">
        <h5>UI Patterns</h5>
      </div>
      <div styleName="items">
        <div styleName="grid-item">
          <h6>Messages</h6>
          <UIPatternsMessages />
        </div>
      </div>
      <div styleName="items">
        <div styleName="grid-item">
          <h6>DescriptionList</h6>
          <UIPatternsDescriptionList />
        </div>
      </div>
    </div>
  );
}

export default UIPatterns;
