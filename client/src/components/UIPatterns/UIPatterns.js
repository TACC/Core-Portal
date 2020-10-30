import React from 'react';
import { Section } from '_common';
import UIPatternsMessage from './UIPatternsMessage';
import UIPatternsSection from './UIPatternsSection';
import UIPatternsDescriptionList from './UIPatternsDescriptionList';
import UIPatternsDropdownSelector from './UIPatternsDropdownSelector';
import UIPatternsPill from './UIPatternsPill';
import './UIPatterns.module.scss';

function UIPatterns() {
  return (
    <Section
      styleName="container"
      header="UI Patterns"
      content={
        <>
          <div styleName="list-item">
            <h6>Section</h6>
            <UIPatternsSection />
          </div>
          <div styleName="list-item">
            <h6>Message</h6>
            <UIPatternsMessage />
          </div>
          <div styleName="list-item">
            <h6>DropdownSelector</h6>
            <UIPatternsDropdownSelector />
          </div>
          <div styleName="list-item">
            <h6>DescriptionList</h6>
            <UIPatternsDescriptionList />
          </div>
          <div styleName="list-item">
            <h6>Pills</h6>
            <UIPatternsPill />
          </div>
        </>
      }
      contentLayoutName="oneColumn"
      contentShouldScroll
    />
  );
}

export default UIPatterns;
