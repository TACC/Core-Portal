import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Alert,
  Badge,
  Button,
  Input,
  FormGroup,
  FormText,
  Label,
  Spinner,
  Container,
  Row,
  Col
} from 'reactstrap';
import { useForm, useField, splitFormProps } from 'react-form';
import { FileInputDropZone } from '_common';
import * as ROUTES from '../../constants/routes';
import './TicketCreateForm.scss';

const InputField = React.forwardRef((props, ref) => {
  const [field, fieldOptions, rest] = splitFormProps(props);

  const {
    meta: { error, isTouched },
    getInputProps
  } = useField(field, fieldOptions);

  const hasError = isTouched && error;

  return (
    <>
      <Input {...getInputProps({ ref, ...rest })} />{' '}
      {hasError && <span className="form-validation-error">{error}</span>}
    </>
  );
});
function validateRequiredText(value) {
  if (!value) {
    return 'A value is required';
  }
  return false;
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

function CreatedTicketInformation({ isAuthenticated, ticketId }) {
  if (!ticketId) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <Alert color="success">
        <Link
          className="ticket-link"
          to={`${ROUTES.WORKBENCH}${ROUTES.DASHBOARD}${ROUTES.TICKETS}/${ticketId}`}
        >
          Ticket (#{ticketId})
        </Link>{' '}
        was created. Support staff will contact you regarding your problem.
      </Alert>
    );
  }
  return (
    <Alert color="success">
      Ticket (#{ticketId}) was created. Support staff will contact you via email
      regarding your problem.
    </Alert>
  );
}

CreatedTicketInformation.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  ticketId: PropTypes.number.isRequired
};

function TicketCreateForm({ authenticatedUser }) {
  const { search } = useLocation();
  const subject = new URLSearchParams(search).get('subject');
  const creating = useSelector(state => state.ticketCreate.creating);
  const creatingError = useSelector(state => state.ticketCreate.creatingError);
  const creatingErrorMessage = useSelector(
    state => state.ticketCreate.creatingErrorMessage
  );
  const creatingSuccess = useSelector(
    state => state.ticketCreate.creatingSuccess
  );
  const createdTicketId = useSelector(
    state => state.ticketCreate.createdTicketId
  );

  const defaultValues = useMemo(
    () => ({
      subject: subject || '',
      problem_description: '',
      first_name: authenticatedUser ? authenticatedUser.first_name : '',
      last_name: authenticatedUser ? authenticatedUser.last_name : '',
      email: authenticatedUser ? authenticatedUser.email : '',
      cc: '',
      attachments: [],
      rejected_attachments: []
    }),
    [authenticatedUser]
  );
  const {
    Form,
    reset,
    meta: { canSubmit, isSubmitted }
  } = useForm({
    defaultValues,
    onSubmit: async (values, instance) => {
      submitCreate(values);
    }
  });

  const dispatch = useDispatch();

  const isAuthenticated = authenticatedUser != null;

  const submitCreate = values => {
    const formData = new FormData();
    formData.append('subject', values.subject);
    formData.append('problem_description', values.problem_description);
    formData.append('first_name', values.first_name);
    formData.append('last_name', values.last_name);
    formData.append('email', values.email);
    formData.append('cc', values.cc);

    if (values.attachments) {
      values.attachments.forEach(attach =>
        formData.append('attachments', attach)
      );
    }

    dispatch({
      type: 'TICKET_CREATE',
      payload: {
        formData,
        resetSubmittedForm: reset,
        refreshTickets: isAuthenticated
      }
    });
  };

  return (
    <Form className="ticket-create-form">
      <FormGroup>
        <Label className="ticket-create-form-label" for="subject">
          Subject
          <Badge className="required-badge" color="danger">
            Required
          </Badge>
        </Label>
        <InputField
          field="subject"
          name="subject"
          validate={validateRequiredText}
        />
      </FormGroup>
      <FormGroup className="ticket-description-group">
        <Label className="ticket-create-form-label">
          Problem Description
          <Badge className="required-badge" color="danger">
            Required
          </Badge>
        </Label>
        <InputField
          field="problem_description"
          type="textarea"
          className="ticket-description-text-area"
          validate={validateRequiredText}
        />
        <FormText>
          Explain your steps leading up to the problem and include any error
          reports
        </FormText>
      </FormGroup>
      <FormGroup>
        <Label>Upload Files</Label>
        <UploadFilesField isSubmitted={isSubmitted} />
        <FormText>
          Error reports and screenshots can be helpful for diagnostics
        </FormText>
      </FormGroup>
      <Container>
        <Row>
          <Col lg="6">
            <FormGroup>
              <Label className="ticket-create-form-label">
                First Name
                <Badge className="required-badge" color="danger">
                  Required
                </Badge>
              </Label>
              <InputField field="first_name" validate={validateRequiredText} />
            </FormGroup>
          </Col>
          <Col lg="6">
            <FormGroup>
              <Label className="ticket-create-form-label">
                Last Name
                <Badge className="required-badge" color="danger">
                  Required
                </Badge>
              </Label>
              <InputField field="last_name" validate={validateRequiredText} />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col lg="6">
            <FormGroup>
              <Label className="ticket-create-form-label">
                Email
                <Badge className="required-badge" color="danger">
                  Required
                </Badge>
              </Label>
              <InputField
                field="email"
                type="email"
                validate={validateRequiredText}
              />
            </FormGroup>
          </Col>
          <Col lg="6">
            <FormGroup>
              <Label>Cc</Label>
              <InputField field="cc" type="email" multiple />
            </FormGroup>
          </Col>
        </Row>
      </Container>
      <div className="ticket-create-button-row">
        {creatingSuccess && (
          <CreatedTicketInformation
            ticketId={createdTicketId}
            isAuthenticated={isAuthenticated}
          />
        )}
        {creatingError && (
          <Alert color="warning">
            Ticket creating error: {creatingErrorMessage}
          </Alert>
        )}
        <Button type="submit" color="primary" disabled={!canSubmit || creating}>
          {creating && <Spinner size="sm" color="white" />}
          Add Ticket
        </Button>
      </div>
    </Form>
  );
}

TicketCreateForm.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  authenticatedUser: PropTypes.object
};

TicketCreateForm.defaultProps = {
  authenticatedUser: null
};

export default TicketCreateForm;
