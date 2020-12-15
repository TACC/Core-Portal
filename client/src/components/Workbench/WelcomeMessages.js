import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'reactstrap';
import * as ROUTES from '../../constants/routes';

const WelcomeMessages = () => {
  const { path } = useRouteMatch();
  const dispatch = useDispatch();

  const welcomeMessages = useSelector(state => state.welcomeMessages);

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
        <Alert
          isOpen={welcomeMessages.datafiles}
          toggle={() => onDismissWelcome('datafiles')}
          color="secondary"
          className="welcomeMessage"
        >
          This page allows you to upload and manage your files.
        </Alert>
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
