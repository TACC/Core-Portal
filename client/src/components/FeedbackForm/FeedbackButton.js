import React from 'react';
import { Button } from 'reactstrap';
import { useSelector } from 'react-redux';
import FeedbackModal from './FeedbackModal';
import './FeedbackButton.scss';

const FeedbackButton = () => {
  const [openModal, setOpenModal] = React.useState(false);
  const authenticatedUser = useSelector(state => state.authenticatedUser.user);

  return (
    <>
      <Button color="link" onClick={() => setOpenModal(true)}>
        Leave Feedback
      </Button>
      {openModal && (
        <FeedbackModal
          isOpen={openModal}
          toggle={() => setOpenModal(!openModal)}
          authenticatedUser={authenticatedUser}
        />
      )}
    </>
  );
};

export default FeedbackButton;
