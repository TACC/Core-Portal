import React from 'react';
import { Section } from '_common';
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
        All Properties
        <small>
          Header (<code>header</code>), Content (<code>content</code>), Content
          Layout (<code>contentLayoutName</code>, default), Should Scroll
          Content (<code>contentShouldScroll</code>, and must resize to scroll),
          Actions (<code>headerActions</code>, a link to a modal), Messages (
          <code>messages</code>)
        </small>
      </dt>
      <dd>
        <Section
          styleName="is-resizable"
          header="Header"
          content={
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
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

export default UIPatternsDropdownSelector;
