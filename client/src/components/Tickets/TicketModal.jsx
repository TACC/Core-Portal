import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
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
} from 'reactstrap';
import * as Yup from 'yup';

import { formatDateTime } from 'utils/timeFormat';
import {
  Button,
  FormField,
  FileInputDropZoneFormField,
  LoadingSpinner,
  Message,
  InfiniteScrollTable,
  Icon,
} from '_common';
import { Formik, Form } from 'formik';
import * as ROUTES from '../../constants/routes';
import './TicketModal.scss';

const formSchema = Yup.object().shape({
  reply: Yup.string().required('Required'),
});
const Attachments = ({ attachments, ticketId }) => {
  const infiniteScrollCallback = useCallback(() => {});
  const noDataText = 'No attachments to display.';
  const json = attachments.map(function attachmentAcessor(x) {
    return {
      attachment_id: x[0],
      attachment_name: x[1],
    };
  });

  const columns = [
    {
      Header: 'Attached Files',
      accessor: 'attachment_name',
      className: 'attachment-title',
      Cell: (el) => (
        <span
          title={el.value}
          id={`attachment${el.row.index}`}
          className="attachment__name"
        >
          {el.value}
        </span>
      ),
    },
    {
      Header: '',
      className: 'attachment-download',
      accessor: 'attachment_id',
      Cell: (el) => (
        <a
          href={`/api/tickets/${ticketId}/attachment/${el.value}`}
          className="link"
          target="_blank"
          rel="noreferrer noopener"
          key={el.value}
        >
          Download
        </a>
      ),
    },
  ];
  return (
    <div>
      <InfiniteScrollTable
        tableColumns={columns}
        className="attachment-table"
        accessor="attachment"
        tableData={json}
        onInfiniteScroll={infiniteScrollCallback}
        noDataText={noDataText}
      />
    </div>
  );
};
Attachments.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.array).isRequired,
  ticketId: PropTypes.string.isRequired,
};

Attachments.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.array).isRequired,
};

function TicketHistoryReply({ ticketId }) {
  const defaultValues = useMemo(
    () => ({
      reply: '',
      attachments: [],
    }),
    []
  );

  const dispatch = useDispatch();

  const gettingTicketHistory = useSelector(
    (state) => state.ticketDetailedView.loading
  );
  const loadingError = useSelector(
    (state) => state.ticketDetailedView.loadingError
  );
  const isReplying = useSelector((state) => state.ticketDetailedView.replying);
  const replyingError = useSelector(
    (state) => state.ticketDetailedView.replyingError
  );
  const maxSizeMessage = useSelector(
    (state) => state.workbench.config.ticketAttachmentMaxSizeMessage
  );
  const maxSize = useSelector(
    (state) => state.workbench.config.ticketAttachmentMaxSize
  );
  return (
    <Formik
      enableReinitialize
      initialValues={defaultValues}
      validationSchema={formSchema}
      onSubmit={(values, { resetForm }) => {
        const formData = new FormData();
        Object.keys(values).forEach((key) => formData.append(key, values[key]));
        if (values.attachments) {
          values.attachments.forEach((attach) =>
            formData.append('attachments', attach)
          );
        }

        dispatch({
          type: 'TICKET_DETAILED_VIEW_REPLY',
          payload: {
            ticketId,
            formData,
            resetSubmittedForm: resetForm,
          },
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
              maxSizeMessage={maxSizeMessage || 'Max File Size: 3MB'}
              maxSize={maxSize || 3145728}
            />
            <FormGroup className="ticket-reply-submission">
              {replyingError && (
                <Message type="error">Something went wrong.</Message>
              )}
              <Button
                attr="submit"
                type="primary"
                disabled={
                  !isValid ||
                  isSubmitting ||
                  isReplying ||
                  gettingTicketHistory ||
                  loadingError
                }
                isLoading={isReplying}
              >
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
  ticketId: PropTypes.number.isRequired,
};

const TicketHistoryCard = ({
  historyId,
  created,
  creator,
  ticketCreator,
  content,
  attachments,
  ticketId,
}) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) =>
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
  const attachmentTitles = (attachments || []).filter(
    (a) => !a[1].toString().startsWith('untitled (')
  );

  const onClick = () => {
    dispatch({
      type: 'TICKET_DETAILED_VIEW_TOGGLE_SHOW_ITEM',
      payload: { index: historyId },
    });
  };

  const onKeyDown = useCallback((e) => {
    if (e.key === ' ') {
      e.preventDefault();
      dispatch({
        type: 'TICKET_DETAILED_VIEW_TOGGLE_SHOW_ITEM',
        payload: { index: historyId },
      });
    }
  });

  return (
    <Card className="mt-1">
      <CardHeader tabIndex="0" onClick={onClick} onKeyDown={onKeyDown}>
        <span className="ticket-history-header d-inline-block text-truncate">
          <strong>
            <span
              className={ticketHeaderClassName}
              id="TicketHeader"
              role="button"
              aria-expanded={isOpen}
              aria-controls="CardBody"
            >
              {creator} | {`${formatDateTime(created)}`}
            </span>
            {!!attachmentTitles.length && (
              <span>
                {' '}
                <Icon name="link" />{' '}
              </span>
            )}
          </strong>{' '}
          {isOpen ? '' : content}
        </span>
        {toggleIcon}
      </CardHeader>
      <Collapse isOpen={isOpen}>
        <CardBody id="CardBody" role="region" aria-labelledby="TicketHeader">
          {content}
        </CardBody>
        {!!attachmentTitles.length && (
          <CardBody className="attached">
            <Attachments attachments={attachmentTitles} ticketId={ticketId} />
          </CardBody>
        )}
      </Collapse>
    </Card>
  );
};

TicketHistoryCard.propTypes = {
  historyId: PropTypes.number.isRequired,
  created: PropTypes.instanceOf(Date).isRequired,
  creator: PropTypes.string.isRequired,
  ticketCreator: PropTypes.bool.isRequired,
  content: PropTypes.string.isRequired,
  attachments: PropTypes.arrayOf(PropTypes.array).isRequired,
  ticketId: PropTypes.string.isRequired,
};

export const TicketHistory = () => {
  const loading = useSelector((state) => state.ticketDetailedView.loading);
  const history = useSelector((state) => state.ticketDetailedView.content);
  const loadingError = useSelector(
    (state) => state.ticketDetailedView.loadingError
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
        <Message type="error" className="ticket-history-error">
          Something went wrong.
        </Message>
      )}
      {history.map((d) => (
        <TicketHistoryCard
          key={d.id}
          historyId={Number(d.id)}
          created={new Date(d.Created)}
          creator={d.Creator}
          ticketCreator={d.IsCreator}
          content={d.Content}
          attachments={d.Attachments}
          ticketId={d.Ticket}
        />
      ))}
      <div ref={ticketHistoryEndRef} />
    </>
  );
};

function TicketModal({ history }) {
  const modalAlwaysOpen = true;
  const ticketId = useSelector((state) => state.ticketDetailedView.ticketId);
  const ticketSubject = useSelector(
    (state) => state.ticketDetailedView.ticketSubject
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
      <ModalHeader toggle={close} charCode="&#xe912;">
        <span className="ticket-id">Ticket {ticketId}</span>
        <span className="ticket-subject">{ticketSubject}</span>
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
  history: PropTypes.object.isRequired,
};

export default withRouter(TicketModal);
