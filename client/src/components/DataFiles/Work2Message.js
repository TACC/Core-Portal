import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Alert } from 'reactstrap';

import * as ROUTES from '../../constants/routes';

const Work2Message = () => {
  const dispatch = useDispatch();
  const { welcomeMessages, showWork2Message } = useSelector(state => ({
    welcomeMessages: state.welcomeMessages,
    showWork2Message: state.workbench.config.showWork2Message
  }));
  const onDismissWelcome = section => {
    const newMessagesState = {
      ...welcomeMessages,
      [section]: false
    };
    dispatch({ type: 'SAVE_WELCOME', payload: newMessagesState });
  };

  return (
    <>
      {showWork2Message && (
        <Alert
          isOpen={welcomeMessages.WORK2}
          toggle={() => onDismissWelcome('WORK2')}
          color="warning"
        >
          <>
            Notice: The Stockyard <code>/work</code> filesystem is being
            deprecated. A new filesystem <code>/work2</code> is now available
            and will eventually replace <code>/work</code>. During the
            transition period, migrate any data you wish to retain. Read more
            information about this change in the{' '}
            <a
              href="https://portal.tacc.utexas.edu/tutorials/stockyard-work-migration"
              target="_blank"
              rel="noreferrer"
              className="wb-link"
            >
              /work Migration and Transition Guide
            </a>
            , or{' '}
            <Link
              className="wb-link"
              to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/create`}
            >
              submit a ticket
            </Link>{' '}
            for help.
          </>
        </Alert>
      )}
    </>
  );
};

export default Work2Message;
