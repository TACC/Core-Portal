import React from 'react';
import { Link } from 'react-router-dom';
import * as ROUTES from './routes';

/**
 * Error Messages
 */
export const INTEGRATION_SETUP_ERROR = (integration) => (
  <span>
    An error occurred setting up {integration}. For help,{' '}
    <Link
      className="wb-link"
      to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
    >
      submit a ticket.
    </Link>
  </span>
);
