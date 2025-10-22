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
import styles from './UIPatterns.module.css';
import UIPatternsSidebar from './UIPatternsSidebar';

function UIPatterns() {
  return (
    <Section
      messageComponentName="UI"
      className={styles.container}
      header="UI Patterns"
      content={
        <>
          <div className={styles['list-item']}>
            <h6>Section</h6>
            <UIPatternsSection />
          </div>
          <div className={styles['list-item']}>
            <h6>Message &amp; Notification</h6>
            <UIPatternsMessage />
          </div>
          <div className={styles['list-item']}>
            <h6>DropdownSelector</h6>
            <UIPatternsDropdownSelector />
          </div>
          <div className={styles['list-item']}>
            <h6>DescriptionList</h6>
            <UIPatternsDescriptionList />
          </div>
          <div className={styles['list-item']}>
            <h6>Pills</h6>
            <UIPatternsPill />
          </div>
          <div className={styles['list-item']}>
            <h6>Show More</h6>
            <UIPatternsShowMore />
          </div>
          <div className={styles['list-item']}>
            <h6>Paginator</h6>
            <UIPatternsPaginator />
          </div>
          <div className={styles['list-item']}>
            <h6>Button</h6>
            <UIPatternsButton />
          </div>
          <div className={styles['list-item']}>
            <h6>Sidebar</h6>
            <UIPatternsSidebar />
          </div>
        </>
      }
      contentLayoutName="oneColumn"
      contentShouldScroll
    />
  );
}

export default UIPatterns;
