import React from 'react';
import { Route, Switch, useRouteMatch, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'reactstrap';
import * as ROUTES from '../../constants/routes';

const WelcomeMessages = () => {
  const { path } = useRouteMatch();
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
    <Switch>
      <Route path={`${path}${ROUTES.DASHBOARD}`}>
        <Alert
          isOpen={welcomeMessages.dashboard}
          toggle={() => onDismissWelcome('dashboard')}
          color="secondary"
          className="welcomeMessage"
        >
          This page allows you to monitor your job status, get help with
          tickets, and view the status of the High Performance Computing (HPC)
          systems.
        </Alert>
      </Route>
      <Route path={`${path}${ROUTES.DATA}`}>
        <div className="welcomeMessage">
          <Alert
            isOpen={welcomeMessages.datafiles}
            toggle={() => onDismissWelcome('datafiles')}
            color="secondary"
          >
            This page allows you to upload and manage your files.
          </Alert>
          {showWork2Message && (
            <Alert
              isOpen={welcomeMessages.work2}
              toggle={() => onDismissWelcome('work2')}
              color="warning"
            >
              <>
                Notice: The Stockyard <code>/work</code> filesystem is being
                deprecated. A new filesystem <code>/work2</code> is now
                available and will eventually replace <code>/work</code>. During
                the transition period, migrate any data you wish to retain. Read
                more information about this change in the{' '}
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
        </div>
      </Route>
      <Route path={`${path}${ROUTES.APPLICATIONS}`}>
        <Alert
          isOpen={welcomeMessages.applications}
          toggle={() => onDismissWelcome('applications')}
          color="secondary"
          className="welcomeMessage"
        >
          This page allows you to submit jobs to the HPC systems or access Cloud
          services using a variety of applications.
        </Alert>
      </Route>
      <Route path={`${path}${ROUTES.ALLOCATIONS}`}>
        <Alert
          isOpen={welcomeMessages.allocations}
          toggle={() => onDismissWelcome('allocations')}
          color="secondary"
          className="welcomeMessage"
        >
          This page allows you to monitor the status of allocations on the HPC
          systems and view a breakdown of team usage.
        </Alert>
      </Route>
      <Route path={`${path}${ROUTES.HISTORY}`}>
        <Alert
          isOpen={welcomeMessages.history}
          toggle={() => onDismissWelcome('history')}
          color="secondary"
          className="welcomeMessage"
        >
          This page allows you to monitor a log of all previous job submissions.
        </Alert>
      </Route>
    </Switch>
  );
};

export default WelcomeMessages;
