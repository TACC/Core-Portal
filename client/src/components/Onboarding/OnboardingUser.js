import React, { useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingSpinner } from '_common';
import { Button } from 'reactstrap';
import { v4 as uuidv4 } from 'uuid';
import OnboardingStep from './OnboardingStep';

import './OnboardingUser.module.scss';
import { TicketCreateModal } from '../Tickets';

const OnboardingUser = () => {
  const { params } = useRouteMatch();
  const dispatch = useDispatch();
  const user = useSelector(state => state.onboarding.user);
  const isStaff = useSelector(state =>
    state.authenticatedUser.user ? state.authenticatedUser.user.isStaff : false
  );
  const loading = useSelector(state => state.onboarding.user.loading);
  const error = useSelector(state => state.onboarding.user.error);
  const ticketModalOpen = useSelector(state => state.ticketCreate.modalOpen);

  useEffect(() => {
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_INDIVIDUAL_USER',
      payload: {
        user: params.username || ''
      }
    });
    dispatch({
      type: 'FETCH_AUTHENTICATED_USER'
    });
  }, [dispatch, params]);

  if (loading) {
    return (
      <div data-testid="loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div>Unable to retrieve your onboarding steps</div>;
  }

  return (
    <div styleName="root">
      <div styleName="title">
        <h2>
          {isStaff
            ? `Onboarding Administration for ${user.username} - ${user.lastName}, ${user.firstName}`
            : 'The following steps must be completed before accessing the portal'}
        </h2>
      </div>
      <div styleName="container">
        {user.steps.map(step => (
          <OnboardingStep step={step} key={uuidv4()} />
        ))}
        <div styleName="access">
          <Button
            color="link"
            styleName="button"
            onClick={() => dispatch({ type: 'TICKET_CREATE_OPEN_MODAL' })}
          >
            Get Help
          </Button>
          <Button
            color="primary"
            styleName="button"
            href="/workbench/"
            disabled={!user.setupComplete}
          >
            Access Dashboard
          </Button>
        </div>
      </div>
      <TicketCreateModal
        close={() => dispatch({ type: 'TICKET_CREATE_CLOSE_MODAL' })}
        isOpen={ticketModalOpen}
      />
    </div>
  );
};

OnboardingUser.propTypes = {};

OnboardingUser.defaultProps = {};

export default OnboardingUser;
