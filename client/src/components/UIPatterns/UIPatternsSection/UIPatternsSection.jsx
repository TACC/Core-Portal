import React from 'react';
import PropTypes from 'prop-types';
import {
  Section,
  SectionTableWrapper,
  DescriptionList,
  InfiniteScrollTable,
  InlineMessage,
  SectionMessage,
} from '_common';
import { Button } from '_common';
import { useDispatch } from 'react-redux';

import styles from './UIPatternsSection.module.css';

function UIPatternsSection() {
  const dispatch = useDispatch();

  function performAction() {
    window.alert(
      'Sample action (no actual action has occurred beyond this alert).'
    );
  }

  return (
    <dl>
      <dt>
        Minimal
        <DescriptionList
          className={styles['term-details']}
          density="compact"
          direction="horizontal"
          data={{
            header: 'Header',
            content: 'Content',
          }}
        />
      </dt>
      <dd>
        <Section header="Header" content={<p>Content</p>} />
      </dd>
      <dt>
        Scrollable
        <DescriptionList
          className={styles['term-details']}
          density="compact"
          direction="horizontal"
          data={{
            contentClassName: 'content--has-list-to-illustrate-scrolling',
            header: 'Milk',
            content: 'Cow, Soy, Nut',
            contentShouldScroll: <code>true</code>,
          }}
        />
      </dt>
      <dd>
        <Section
          contentClassName={styles['content--has-list-to-illustrate-scrolling']}
          header="Milk"
          content={
            <ul>
              <li>Cow</li>
              <li>Soy</li>
              <li>Nut</li>
            </ul>
          }
          contentShouldScroll
        />
      </dd>
      <dt>
        With a Complex Table
        <DescriptionList
          className={styles['term-details']}
          direction="vertical"
          data={{
            contentClassName: 'content--has-table-to-illustrate-scrolling',
            header:
              'Section with <SectionTableWrapper> and <InfiniteScrollTable>',
            content: '(paragraph, table, paragraph)',
            headerActions: '(a button to trigger sample action)',
            contentLayoutName: 'oneColumn',
          }}
        />
      </dt>
      <dd>
        <Section
          contentClassName={
            styles['content--has-table-to-illustrate-scrolling']
          }
          header={
            <>
              Section with <code>{`<SectionTableWrapper>`}</code> and &nbsp;
              <code>{`<InfiniteScrollTable>`}</code>
            </>
          }
          content={
            <>
              <InlineMessage type="info" className={styles.notice}>
                The header will not be sticky until the branch &nbsp;
                <code>task/FP-385-section-comp-welcome-msg--sections</code>
                &nbsp;refactors <code>InfiniteScrollTable</code>.
              </InlineMessage>
              <SectionTableWrapper className={styles.table} contentShouldScroll>
                <UIPatternsSectionTableInfinite />
              </SectionTableWrapper>
            </>
          }
          headerActions={
            <button type="button" onClick={performAction}>
              Click Me
            </button>
          }
          contentLayoutName="oneColumn"
        />
      </dd>
      <dt>
        All Properties
        <DescriptionList
          className={styles['term-details']}
          direction="vertical"
          data={{
            className: 'is-resizable',
            contentClassName: 'content--should-always-show-scrollbar',
            header: 'Header',
            content: (
              <>
                (instruction list, table <strong>sans</strong>
                &nbsp;<code>{`<SectionTableWrapper>`}</code>, and a paragraph)
              </>
            ),
            contentLayoutName: 'oneColumn',
            headerActions: '(a link to a modal)',
            messages: '(a <SectionMessage>)',
            contentShouldScroll: (
              <>
                <code>true</code> (must resize to scroll)
              </>
            ),
          }}
        />
      </dt>
      <dd>
        <Section
          className={styles['is-resizable']}
          contentClassName={styles['content--should-always-show-scrollbar']}
          header="Header"
          content={
            <>
              <p>Test Instructions:</p>
              <ol>
                <li>
                  Resize this <code>{`<Section>`}</code> to confirm that its
                  content <strong>both</strong> stretches vertically and
                  horizontally <strong>and</strong> supports scrolling.
                </li>
                <li>
                  Close the <code>{`<SectionMessage>`}</code> to confirm that
                  the stretching and scrolling is not dependent on its presence.
                </li>
                <li>
                  Open the modal to test that section do not break that feature.
                  The page redirects is a fault of how Wes no knowing how to
                  properly add a modal.
                </li>
              </ol>
              <p>
                <small>
                  The scroll area being always present—even if there is no
                  scrollbar—is a one-off style here <em>only</em> to visually
                  show that the section stretches.
                </small>
              </p>
              <UIPatternsSectionTablePlain className={styles.table} />
            </>
          }
          contentLayoutName="oneColumn"
          headerActions={
            <Button
              type="link"
              onClick={() =>
                dispatch({
                  type: 'TICKET_CREATE_OPEN_MODAL',
                  payload: {
                    provideDashBoardLinkOnSuccess: false,
                    showAsModalOnDashboard: false,
                  },
                })
              }
            >
              Open Modal
            </Button>
          }
          messages={
            <SectionMessage type="info" canDismiss>
              If you close me, the content below will fill the space I occupied.
            </SectionMessage>
          }
          contentShouldScroll
        />
      </dd>
    </dl>
  );
}

export default UIPatternsSection;

function UIPatternsSectionTableInfinite({ className }) {
  const tableData = [
    {
      col1: 'Hello',
      col2: 'World',
    },
    {
      col1: 'react-table',
      col2: 'rocks',
    },
    {
      col1: 'whatever',
      col2: 'you want',
    },
  ];

  const tableColumns = [
    {
      Header: 'Column 1',
      accessor: 'col1', // accessor is the "key" in the data
    },
    {
      Header: 'Column 2',
      accessor: 'col2',
    },
  ];

  return (
    <InfiniteScrollTable
      className={className}
      tableColumns={tableColumns}
      tableData={tableData}
    />
  );
}
UIPatternsSectionTableInfinite.propTypes = {
  /** Additional className for the root element */
  className: PropTypes.string,
};
UIPatternsSectionTableInfinite.defaultProps = {
  className: '',
};

function UIPatternsSectionTablePlain({ className }) {
  return (
    <table className={className}>
      <thead>
        <tr>
          <th>Column 1</th>
          <th>Column 2</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Hello</td>
          <td>World</td>
        </tr>
        <tr>
          <td>react-table</td>
          <td>rocks</td>
        </tr>
        <tr>
          <td>whatever</td>
          <td>you want</td>
        </tr>
      </tbody>
    </table>
  );
}
UIPatternsSectionTablePlain.propTypes = {
  /** Additional className for the root element */
  className: PropTypes.string,
};
UIPatternsSectionTablePlain.defaultProps = {
  className: '',
};
