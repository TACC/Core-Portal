import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  Badge,
  Button,
  CardHeader,
  CardBody,
  Card,
  Collapse,
  Container,
  Row,
  Col,
  Input,
  FormGroup,
  FormText,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  Spinner
} from 'reactstrap';
import { useForm, useField } from 'react-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSun,
  faChevronCircleDown,
  faChevronCircleUp,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import FileInputDropZone from './FileInputDropZone';
import './TicketModal.scss';

async function validateReply(reply, instance) {
  if (!reply) {
    return 'A reply is required';
  }
  return false;
}

function ReplyField() {
  const {
    meta: { error, isTouched },
    getInputProps
  } = useField('reply', {
    validate: validateReply
  });

  const hasError = isTouched && error;

  return (
    <>
      <Input
        type="textarea"
        className="ticket-reply-text-area"
        {...getInputProps()}
      />{' '}
      {hasError && <em>{error}</em>}
    </>
  );
}

function UploadFilesField() {
  const { setValue } = useField('attachments');

  return <FileInputDropZone onFilesChanged={setValue} />;
}

function TicketHistoryReply({ ticketId }) {
  const defaultValues = useMemo(
    () => ({
      reply: '',
      attachments: []
    }),
    []
  );
  const {
    Form,
    reset,
    meta: { canSubmit }
  } = useForm({
    defaultValues,
    onSubmit: async (values, instance) => {
      submitReply(values);
    }
  });

  const dispatch = useDispatch();

  const submitReply = values => {
    const formData = new FormData();
    formData.append('reply', values.reply);
    if (values.attachments) {
      values.attachments.forEach(attach =>
        formData.append('attachments', attach)
      );
    }

    dispatch({
      type: 'REPLY_TICKET_HISTORY',
      payload: {
        ticketId,
        formData,
        resetSubmittedForm: reset
      }
    });
  };

  const gettingTicketHistory = useSelector(
    state => state.ticketHistory.loading
  );
  const loadingError = useSelector(state => state.ticketHistory.loadingError);
  const isReplying = useSelector(state => state.ticketHistory.replying);
  const replyingError = useSelector(state => state.ticketHistory.replyingError);
  return (
    <Form className="ticket-reply-form">
      <FormGroup className="ticket-reply-group">
        <Label>
          Reply <Badge color="danger">Required</Badge>
        </Label>
        <ReplyField />
      </FormGroup>
      <FormGroup>
        <Label>Upload Files</Label>
        <UploadFilesField />
        <FormText>
          Error reports and screenshots can be helpful for diagnostics
        </FormText>
      </FormGroup>
      <FormGroup className="ticket-reply-button">
        <Button
          type="submit"
          color="primary"
          id="TicketReplyButton"
          disabled={
            !canSubmit || isReplying || gettingTicketHistory || loadingError
          }
        >
          {isReplying && <Spinner size="sm" color="white" />}{' '}
          {replyingError && <FontAwesomeIcon icon={faExclamationCircle} />}{' '}
          Reply
        </Button>
      </FormGroup>
    </Form>
  );
}

TicketHistoryReply.propTypes = {
  ticketId: PropTypes.number.isRequired
};

const TicketHistoryCard = ({
  historyId,
  created,
  creator,
  ticketCreator,
  content
}) => {
  const dispatch = useDispatch();
  const isOpen = useSelector(state =>
    state.ticketHistory.showItems.includes(historyId)
  );

  let toggleIcon;
  if (isOpen) {
    toggleIcon = <FontAwesomeIcon icon={faChevronCircleUp} />;
  } else {
    toggleIcon = <FontAwesomeIcon icon={faChevronCircleDown} />;
  }

  return (
    <Card className="mt-1">
      <CardHeader
        onClick={() =>
          dispatch({
            type: 'TICKET_HISTORY_TOGGLE_SHOW_ITEM',
            payload: { index: historyId }
          })
        }
      >
        <span className="ticket-history-header d-inline-block text-truncate">
          <strong>
            {ticketCreator ? (
              <span className="ticket-creator"> {creator} </span>
            ) : (
              creator
            )}{' '}
            | {created.getMonth() + 1}/{created.getDate()}/
            {created.getFullYear()} {created.getHours()}:{created.getMinutes()}
          </strong>{' '}
          {isOpen ? '' : content}
        </span>
        {toggleIcon}
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody>{content}</CardBody>
      </Collapse>
    </Card>
  );
};

TicketHistoryCard.propTypes = {
  historyId: PropTypes.number.isRequired,
  created: PropTypes.instanceOf(Date).isRequired,
  creator: PropTypes.string.isRequired,
  ticketCreator: PropTypes.bool.isRequired,
  content: PropTypes.string.isRequired
};

const TicketHistory = ({ ticketId }) => {
  const dispatch = useDispatch();
  const loading = useSelector(state => state.ticketHistory.loading);
  const history = useSelector(state => state.ticketHistory.content);
  const loadingError = useSelector(state => state.ticketHistory.loadingError);
  const ticketHistoryEndRef = useRef();

  const scrollToBottom = () => {
    ticketHistoryEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [history]);

  useEffect(() => {
    dispatch({
      type: 'GET_TICKET_HISTORY',
      payload: {
        ticketId
      }
    });
  }, [dispatch, ticketId]);

  return (
    <>
      <div className="ticket-history-loading-icon">
        {loading && <FontAwesomeIcon icon={faSun} size="8x" spin />}
        {loadingError && (
          <FontAwesomeIcon icon={faExclamationCircle} size="8x" />
        )}
      </div>
      {history.map(d => (
        <TicketHistoryCard
          key={d.id}
          historyId={Number(d.id)}
          created={new Date(d.Created)}
          creator={d.Creator}
          ticketCreator={d.IsCreator}
          content={d.Content}
        />
      ))}
      <div ref={ticketHistoryEndRef} />
    </>
  );
};

TicketHistory.propTypes = {
  ticketId: PropTypes.number.isRequired
};

const TicketModal = ({ ticketId, ticketSubject, toggle, showModal }) => {
  if (!showModal) {
    return null;
  }

  return (
    <Modal
      className="ticket-model-content"
      isOpen={showModal}
      toggle={toggle}
      size="lg"
    >
      <ModalHeader toggle={toggle}>
        <span className="modal-header-title d-inline-block text-truncate">
          {ticketSubject}
        </span>
      </ModalHeader>
      <ModalBody>
        <Container className="ticket-detailed-view-container">
          <Row className="ticket-detailed-view-row">
            <Col lg="7" className="ticket-history">
              <TicketHistory ticketId={ticketId} />
            </Col>
            <Col lg="5">
              <TicketHistoryReply ticketId={ticketId} />
            </Col>
          </Row>
        </Container>
      </ModalBody>
    </Modal>
  );
};

TicketModal.propTypes = {
  ticketId: PropTypes.number.isRequired,
  ticketSubject: PropTypes.string.isRequired,
  toggle: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired
};

export default TicketModal;
