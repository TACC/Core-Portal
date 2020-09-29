import React, { useEffect } from 'react';
import { Button } from 'reactstrap';
import { useSelector } from 'react-redux';
import FeedbackModal from './FeedbackModal';
import './FeedbackButton.module.scss';

const FeedbackButton = () => {
  const [openModal, setOpenModal] = React.useState(false);
  const creatingSuccess = useSelector(
    state => state.ticketCreate.creatingSuccess
  );
  useEffect(() => {
    if (creatingSuccess) {
      setOpenModal(false);
    }
  }, [creatingSuccess]);

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
