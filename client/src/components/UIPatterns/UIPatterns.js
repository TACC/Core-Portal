import React from 'react';
import { Section } from '_common';
import UIPatternsMessage from './UIPatternsMessage';
import UIPatternsSection from './UIPatternsSection';
import UIPatternsDescriptionList from './UIPatternsDescriptionList';
import UIPatternsDropdownSelector from './UIPatternsDropdownSelector';
import UIPatternsPill from './UIPatternsPill';
import UIPatternsShowMore from './UIPatternsShowMore';
import UIPatternsPaginator from './UIPatternsPaginator';
import UIPatternsButton from './UIPatternsButton';
import './UIPatterns.module.scss';

function UIPatterns() {
  return (
    <Section
      introMessageName="UI"
      styleName="container"
      header="UI Patterns"
      content={
        <>
          <div styleName="list-item">
            <h6>Section</h6>
            <UIPatternsSection />
          </div>
          <div styleName="list-item">
            <h6>Message &amp; Notification</h6>
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
          <div styleName="list-item">
            <h6>Show More</h6>
            <UIPatternsShowMore />
          </div>
          <div styleName="list-item">
            <h6>Paginator</h6>
            <UIPatternsPaginator />
          </div>
          <div styleName="list-item" className="mb-5">
            <h6>Button Component</h6>
            <UIPatternsButton />
          </div>
          

        </>
      }
      contentLayoutName="oneColumn"
      contentShouldScroll
    />
  );
}

export default UIPatterns;
