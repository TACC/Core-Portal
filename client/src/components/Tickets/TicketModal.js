import React, { useEffect, useMemo, useRef } from 'react';
import { withRouter } from 'react-router-dom';
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
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { formatDateTime } from 'utils/timeFormat';
import { FileInputDropZone, LoadingSpinner } from '_common';
import * as ROUTES from '../../constants/routes';
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
      {hasError && <span className="form-validation-error">{error}</span>}
    </>
  );
}

function UploadFilesField({ isSubmitted }) {
  const { value, pushValue, removeValue } = useField('attachments');

  return (
    <FileInputDropZone
      files={value}
      onAddFile={pushValue}
      onRemoveFile={removeValue}
      isSubmitted={isSubmitted}
    />
  );
}

UploadFilesField.propTypes = {
  isSubmitted: PropTypes.bool.isRequired
};

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
    meta: { canSubmit, isSubmitted }
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
      type: 'TICKET_DETAILED_VIEW_REPLY',
      payload: {
        ticketId,
        formData,
        resetSubmittedForm: reset
      }
    });
  };

  const gettingTicketHistory = useSelector(
    state => state.ticketDetailedView.loading
  );
  const loadingError = useSelector(
    state => state.ticketDetailedView.loadingError
  );
  const isReplying = useSelector(state => state.ticketDetailedView.replying);
  const replyingError = useSelector(
    state => state.ticketDetailedView.replyingError
  );
  return (
    <Form className="ticket-reply-form">
      <FormGroup className="ticket-reply-group">
        <Label className="ticket-reply-form-label">
          Reply
          <Badge className="required-badge" color="danger">
            Required
          </Badge>
        </Label>
        <ReplyField />
      </FormGroup>
      <FormGroup>
        <Label>Upload Files</Label>
        <UploadFilesField isSubmitted={isSubmitted} />
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
    state.ticketDetailedView.showItems.includes(historyId)
  );

  let toggleIcon;
  if (isOpen) {
    toggleIcon = <i className="icon-action icon-action-collapse" />;
  } else {
    toggleIcon = <i className="icon-action icon-action-expand" />;
  }

  return (
    <Card className="mt-1">
      <CardHeader
        onClick={() =>
          dispatch({
            type: 'TICKET_DETAILED_VIEW_TOGGLE_SHOW_ITEM',
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
            | {`${formatDateTime(created)}`}
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

const TicketHistory = () => {
  const loading = useSelector(state => state.ticketDetailedView.loading);
  const history = useSelector(state => state.ticketDetailedView.content);
  const loadingError = useSelector(
    state => state.ticketDetailedView.loadingError
  );
  const ticketHistoryEndRef = useRef();

  const scrollToBottom = () => {
    ticketHistoryEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [history]);

  return (
    <>
      {loading && <LoadingSpinner />}
      {loadingError && (
        <div className="ticket-history-loading-icon">
          <FontAwesomeIcon icon={faExclamationCircle} size="8x" />
        </div>
      )}
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

function TicketModal({ history }) {
  const modalAlwaysOpen = true;
  const ticketId = useSelector(state => state.ticketDetailedView.ticketId);
  const ticketSubject = useSelector(
    state => state.ticketDetailedView.ticketSubject
  );

  const close = () => {
    history.push(`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}`);
  };

  return (
    <Modal
      className="ticket-model-content"
      isOpen={modalAlwaysOpen}
      toggle={close}
      size="lg"
    >
      <ModalHeader toggle={close}>
        <span className="modal-header-title d-inline-block text-truncate">
          {ticketSubject}
        </span>
      </ModalHeader>
      <ModalBody>
        <Container className="ticket-detailed-view-container">
          <Row className="ticket-detailed-view-row">
            <Col lg="7" className="ticket-history">
              <TicketHistory />
            </Col>
            <Col lg="5">
              <TicketHistoryReply ticketId={ticketId} />
            </Col>
          </Row>
        </Container>
      </ModalBody>
    </Modal>
  );
}

TicketModal.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  history: PropTypes.object.isRequired
};

export default withRouter(TicketModal);
