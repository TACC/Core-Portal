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
      <dt>Minimal Properties</dt>
      <dd>
        <Section header={<h2>Header</h2>} content={<p>Content</p>} />
      </dd>
      <dt>Scrollable Content</dt>
      <dd>
        <Section
          header={<h2>Milk</h2>}
          contentStyleName="is-scrollable"
          content={
            <ul>
              <li>Cow</li>
              <li>Soy</li>
              <li>Nut</li>
            </ul>
          }
          shouldScrollContent
        />
      </dd>
      <dt>All Properties</dt>
      <dd>
        <Section
          header={<h2>Header</h2>}
          content={<p>Content</p>}
          actions={<Link to={modalPath}>Open Modal</Link>}
          externals={
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
          }
          messages={
            <UncontrolledAlert color="secondary">Message</UncontrolledAlert>
          }
        />
      </dd>
    </dl>
  );
}

export default UIPatternsDropdownSelector;
