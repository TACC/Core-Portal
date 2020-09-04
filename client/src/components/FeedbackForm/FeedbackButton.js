import React from 'react';
import { Button } from 'reactstrap';
import FeedbackModal from './FeedbackModal';
import './FeedbackButton.module.scss';

const FeedbackButton = () => {
  const [openModal, setOpenModal] = React.useState(false);

  return (
    <>
      <Button
        styleName="button"
        color="link"
        onClick={() => setOpenModal(true)}
      >
        Leave Feedback
      </Button>
      {openModal && (
        <FeedbackModal
          isOpen={openModal}
          toggle={() => setOpenModal(!openModal)}
        />
      )}
    </>
  );
};

export default FeedbackButton;
