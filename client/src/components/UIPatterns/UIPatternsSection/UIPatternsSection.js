import React from 'react';
import PropTypes from 'prop-types';
import {
  Section,
  SectionTable,
  DescriptionList,
  InfiniteScrollTable
} from '_common';
import { UncontrolledAlert } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';

import * as ROUTES from '../../../constants/routes';

import { TicketCreateModal } from '../../Tickets';

import './UIPatternsSection.module.css';

const modalPath = `${ROUTES.WORKBENCH}${ROUTES.UI}/modal`;

function UIPatternsSection() {
  const dispatch = useDispatch();

  function performAction() {
    // eslint-disable-next-line no-alert
    window.alert(
      'Sample action (no actual action has occurred beyond this alert).'
    );
  }

  return (
    <dl>
      <dt>
        Minimal
        <small>
          Header (<code>header</code>), Content (<code>content</code>)
        </small>
      </dt>
      <dd>
        <Section
          header="Header"
          content={<p>Content</p>}
          contentLayoutName="oneColumn"
        />
      </dd>
      <dt>
        Scrollable
        <small>
          Header (<code>header</code>), Content (<code>content</code>, forced
          scroll), Should Scroll Content (<code>contentShouldScroll</code>, and
          scroll has been forced),
        </small>
      </dt>
      <dd>
        <Section
          header="Milk"
          contentStyleName="is-scrollable"
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
          className="small"
          density="compact"
          direction="horizontal"
          data={{
            header: 'Section with <SectionTable> and <InfiniteScrollTable>',
            content: '(paragraph, table, paragraph)',
            headerActions: '(a button to trigger sample action)'
          }}
        />
      </dt>
      <dd>
        <Section
          contentStyleName="has-infinite-scroll-table"
          header={
            <>
              Section with <code>&lt;SectionTable&gt;</code> and
              &nbsp;<code>&lt;InfiniteScrollTable&gt;</code>
            </>
          }
          content={
            <SectionTable styleName="table" manualContent>
              <p>
                A UI element can appear <em>above</em> the table.
              </p>
              <div className="o-flex-item-table-wrap">
                <UIPatternsSectionTableInfinite />
              </div>
              <p>
                A UI element can appear <em>below</em> the table.
              </p>
            </SectionTable>
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
          className="small"
          density="compact"
          direction="horizontal"
          data={{
            header: 'Header',
            content: '(instruction list and a paragraph)',
            contentLayoutName: 'oneColumn',
            contentShouldScroll: (
              <>
                <code>true</code> (must resize to scroll)
              </>
            ),
            headerActions: '(a link to a modal)',
            messages: '(an <UncontrolledAlert>)'
          }}
        />
      </dt>
      <dd>
        <Section
          styleName="is-resizable"
          contentStyleName="content-that-illustrates-scrolling"
          header="Header"
          content={
            <>
              <p>Test Instructions:</p>
              <ol>
                <li>
                  Resize this <code>&lt;Section&gt;</code> to confirm that its
                  content <strong>both</strong> stretches vertically and
                  horizontally <strong>and</strong> supports scrolling.
                </li>
                <li>
                  Close the <code>&lt;WelcomeMessage&gt;</code> to confirm that
                  the stretching and scrolling is not dependent on its presence.
                </li>
                <li>
                  Open the modal to test that section do not break that feature.
                  The page redirects is a fault of how Wes no knowing how to
                  properly add a modal.
                </li>
              </ol>
              <SectionTable styleName="table" manualContent>
                <UIPatternsSectionTablePlain />
              </SectionTable>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </>
          }
          contentLayoutName="oneColumn"
          headerActions={
            <>
              <Link to={modalPath}>Open Modal</Link>
              <Switch>
                <Route
                  exact
                  path={modalPath}
                  render={() => {
                    dispatch({
                      type: 'TICKETS_CREATE_INIT'
                    });
                    return <TicketCreateModal />;
                  }}
                />
              </Switch>
            </>
          }
          messages={
            <UncontrolledAlert color="secondary">Message</UncontrolledAlert>
          }
          contentShouldScroll
        />
      </dd>
    </dl>
  );
}

export default UIPatternsSection;

function UIPatternsSectionTableInfinite({ hasInfiniteScroll }) {
  const tableData = [
    {
      col1: 'Hello',
      col2: 'World'
    },
    {
      col1: 'react-table',
      col2: 'rocks'
    },
    {
      col1: 'whatever',
      col2: 'you want'
    }
  ];

  const tableColumns = [
    {
      Header: 'Column 1',
      accessor: 'col1' // accessor is the "key" in the data
    },
    {
      Header: 'Column 2',
      accessor: 'col2'
    }
  ];

  return (
    <InfiniteScrollTable tableColumns={tableColumns} tableData={tableData} />
  );
}
UIPatternsSectionTableInfinite.propTypes = {
  /** Whether to use an <InfiniteScrollTable> */
  hasInfiniteScroll: PropTypes.bool
};
UIPatternsSectionTableInfinite.defaultProps = {
  hasInfiniteScroll: false
};

function UIPatternsSectionTablePlain() {
  return (
    <table>
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
