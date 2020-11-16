import React, { useEffect } from 'react';
import { Button } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import FeedbackModal from './FeedbackModal';
import './FeedbackButton.module.scss';

const FeedbackButton = () => {
  const [openFeedbackModal, setopenFeedbackModal] = React.useState(false);
  const creatingSuccess = useSelector(
    state => state.ticketCreate.creatingSuccess
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (creatingSuccess && openFeedbackModal) {
      const toast = {
        pk: 'feedback-toast',
        event_type: 'generic',
        message: 'Feedback submitted',
        extra: {}
      };
      dispatch({
        type: 'ADD_TOAST',
        payload: toast
      });
      setopenFeedbackModal(false);
    }
  }, [creatingSuccess]);

  return (
    <>
      <Button
        styleName="button"
        color="link"
        data-testid="feedback-button"
        onClick={() => setopenFeedbackModal(true)}
      >
        Leave Feedback
      </Button>
      {openFeedbackModal && (
        <FeedbackModal
          isOpen={openFeedbackModal}
          toggle={() => setopenFeedbackModal(!openFeedbackModal)}
        />
      )}
    </>
  );
};

export default FeedbackButton;
