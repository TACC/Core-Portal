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
import styles from './UIPatterns.module.scss';
import UIPatternsSidebar from './UIPatternsSidebar';
import { Button } from '@tacc/core-components/components/ui/button';

const SHADCN_BUTTON_VARIANTS = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
];
const SHADCN_BUTTON_TEXT_SIZES = ['xs', 'sm', 'default', 'lg'];
const SHADCN_BUTTON_ICON_SIZES = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'];

function UIPatterns() {
  return (
    <Section
      messageComponentName="UI"
      className={styles.container}
      header="UI Patterns"
      content={
        <>
          <h1 style={{ marginTop: '2rem' }}>Version 4</h1>
          <div className={styles['list-item']}>
            <h6>Button (ShadCN) &mdash; variant &times; size</h6>
            {SHADCN_BUTTON_VARIANTS.map((variant) => (
              <div
                key={variant}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.5rem',
                }}
              >
                <span
                  style={{
                    width: 80,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                  }}
                >
                  {variant}
                </span>
                {SHADCN_BUTTON_TEXT_SIZES.map((size) => (
                  <Button key={size} variant={variant} size={size}>
                    {size}
                  </Button>
                ))}
                {SHADCN_BUTTON_ICON_SIZES.map((size) => (
                  <Button
                    key={size}
                    variant={variant}
                    size={size}
                    aria-label={size}
                  >
                    &#9733;
                  </Button>
                ))}
              </div>
            ))}
          </div>
          <div className={styles['list-item']}>
            <h6>Button (ShadCN) &mdash; disabled</h6>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {SHADCN_BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant} disabled>
                  {variant}
                </Button>
              ))}
            </div>
          </div>

          <hr />

          <h1 style={{ marginTop: '2rem' }}>Version 3</h1>
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
