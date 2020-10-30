import React from 'react';
import UIPatternsMessage from './UIPatternsMessage';
import UIPatternsDescriptionList from './UIPatternsDescriptionList';
import UIPatternsDropdownSelector from './UIPatternsDropdownSelector';
import UIPatternsPill from './UIPatternsPill';
import './UIPatterns.module.scss';

function UIPatterns() {
  return (
    <div styleName="container">
      <div styleName="header">
        <h5>UI Patterns</h5>
      </div>
      <div styleName="items">
        <div styleName="grid-item">
          <h6>Message</h6>
          <UIPatternsMessage />
        </div>
        <div styleName="grid-item">
          <h6>DropdownSelector</h6>
          <UIPatternsDropdownSelector />
        </div>
      </div>
      <div styleName="items">
        <div styleName="grid-item">
          <h6>DescriptionList</h6>
          <UIPatternsDescriptionList />
        </div>
      </div>
      <div styleName="items">
        <div styleName="grid-item">
          <h6>Pills</h6>
          <UIPatternsPill />
        </div>
      </div>
    </div>
  );
}

export default UIPatterns;
