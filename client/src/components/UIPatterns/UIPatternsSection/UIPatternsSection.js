import React from 'react';
import { Section, DescriptionList } from '_common';
import { UncontrolledAlert } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { Link, Route, Switch } from 'react-router-dom';
import * as ROUTES from '../../../constants/routes';
import { TicketCreateModal } from '../../Tickets';

import './UIPatternsSection.module.css';

const modalPath = `${ROUTES.WORKBENCH}${ROUTES.UI}/modal`;

function UIPatternsDropdownSelector() {
  const dispatch = useDispatch();

  return (
    <dl>
      <dt>
        Minimal
        <DescriptionList
          className="small"
          density="compact"
          direction="horizontal"
          data={{
            header: 'Header',
            content: 'Content'
          }}
        />
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
        <DescriptionList
          className="small"
          density="compact"
          direction="horizontal"
          data={{
            header: 'Milk',
            content: 'Cow, Soy, Nut',
            contentShouldScroll: <code>true</code>
          }}
        />
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
        All Properties
        <DescriptionList
          className="small"
          density="compact"
          direction="horizontal"
          data={{
            header: 'Header',
            content: '(instruction list and a paragraph)',
            contentLayoutName: 'oneColumn (default value)',
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
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <Switch>
                <Route
                  exact
                  path={modalPath}
                  render={() => {
                    dispatch({
                      type: 'TICKET_CREATE_OPEN_MODAL'
                    });
                    return <TicketCreateModal />;
                  }}
                />
              </Switch>
            </>
          }
          contentLayoutName="oneColumn"
          headerActions={<Link to={modalPath}>Open Modal</Link>}
          messages={
            <UncontrolledAlert color="secondary">Message</UncontrolledAlert>
          }
          contentShouldScroll
        />
      </dd>
    </dl>
  );
}

export default UIPatternsDropdownSelector;
