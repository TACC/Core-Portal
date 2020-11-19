import React, { useEffect, useMemo, useRef } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  CardHeader,
  CardBody,
  Card,
  Collapse,
  Container,
  Row,
  Col,
  FormGroup,
  Modal,
  ModalHeader,
  ModalBody,
  Spinner
} from 'reactstrap';
import * as Yup from 'yup';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { formatDateTime } from 'utils/timeFormat';
import { FormField, FileInputDropZoneFormField, LoadingSpinner } from '_common';
import { Formik, Form } from 'formik';
import * as ROUTES from '../../constants/routes';
import './TicketModal.scss';

const formSchema = Yup.object().shape({
  reply: Yup.string().required('Required')
});

function TicketHistoryReply({ ticketId }) {
  const defaultValues = useMemo(
    () => ({
      reply: '',
      attachments: []
    }),
    []
  );

  const dispatch = useDispatch();

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
    <Formik
      enableReinitialize
      initialValues={defaultValues}
      validationSchema={formSchema}
      onSubmit={(values, { resetForm }) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => formData.append(key, values[key]));
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
            resetSubmittedForm: resetForm
          }
        });
      }}
    >
      {({ isSubmitting, isValid }) => {
        return (
          <Form className="ticket-reply-form">
            <FormField
              name="reply"
              label="Reply"
              type="textarea"
              className="ticket-reply-text-area"
              required
            />
            <FileInputDropZoneFormField
              id="attachments"
              isSubmitted={isSubmitting}
              description="Error reports and screenshots can be helpful for diagnostics"
              maxSizeMessage="Max File Size: 3MB"
              maxSize={3145728}
            />
            <FormGroup className="ticket-reply-button">
              <Button
                type="submit"
                color="primary"
                disabled={
                  !isValid ||
                  isSubmitting ||
                  isReplying ||
                  gettingTicketHistory ||
                  loadingError
                }
              >
                {isReplying && <Spinner size="sm" color="white" />}{' '}
                {replyingError && (
                  <FontAwesomeIcon icon={faExclamationCircle} />
                )}{' '}
                Reply
              </Button>
            </FormGroup>
          </Form>
        );
      }}
    </Formik>
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
    toggleIcon = <i className="icon-action icon-collapse" />;
  } else {
    toggleIcon = <i className="icon-action icon-expand" />;
  }

  const ticketHeaderClassName = ticketCreator
    ? 'ticket-creator'
    : 'ticket-responder';

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
            <span className={ticketHeaderClassName}>
              {creator} | {`${formatDateTime(created)}`}
            </span>
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
          <span className="ticket-id">Ticket {ticketId}</span>
          <span className="ticket-subject">{ticketSubject}</span>
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
