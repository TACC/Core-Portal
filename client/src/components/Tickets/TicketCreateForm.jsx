import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Formik, Form } from 'formik';
import {
  Alert,
  Col,
  Container,
  FormGroup,
  ModalBody,
  ModalFooter,
  Row,
  Spinner,
} from 'reactstrap';
import * as Yup from 'yup';
import { Button, FileInputDropZoneFormField, FormField } from '_common';
import ReCAPTCHA from 'react-google-recaptcha';
import * as ROUTES from '../../constants/routes';
import './TicketCreateForm.scss';

function CreatedTicketInformation({ provideDashBoardLinkOnSuccess, ticketId }) {
  if (!ticketId) {
    return null;
  }

  if (provideDashBoardLinkOnSuccess) {
    return (
      <Alert color="success" className="ticket-create-info-alert">
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
    <Alert color="success" className="ticket-creation-info-alert">
      Ticket (#{ticketId}) was created. Support staff will contact you via email
      regarding your problem.
    </Alert>
  );
}

CreatedTicketInformation.propTypes = {
  provideDashBoardLinkOnSuccess: PropTypes.bool.isRequired,
  ticketId: PropTypes.number.isRequired,
};

function TicketCreateForm({
  authenticatedUser,
  initialSubject,
  provideDashBoardLinkOnSuccess,
}) {
  const creating = useSelector((state) => state.ticketCreate.creating);
  const creatingError = useSelector(
    (state) => state.ticketCreate.creatingError
  );
  const creatingErrorMessage = useSelector(
    (state) => state.ticketCreate.creatingErrorMessage
  );
  const creatingSuccess = useSelector(
    (state) => state.ticketCreate.creatingSuccess
  );
  const createdTicketId = useSelector(
    (state) => state.ticketCreate.createdTicketId
  );
  const recaptchaSiteKey = useSelector(
    (state) => state.workbench.recaptchaSiteKey
  );
  const maxSizeMessage = useSelector(
    (state) => state.workbench.config.ticketAttachmentMaxSizeMessage
  );
  const maxSize = useSelector(
    (state) => state.workbench.config.ticketAttachmentMaxSize
  );

  const defaultValues = useMemo(
    () => ({
      subject: initialSubject,
      problem_description: '',
      first_name: authenticatedUser ? authenticatedUser.first_name : '',
      last_name: authenticatedUser ? authenticatedUser.last_name : '',
      email: authenticatedUser ? authenticatedUser.email : '',
      cc: '',
      attachments: [],
      recaptchaResponse: '',
    }),
    [authenticatedUser, initialSubject]
  );

  const dispatch = useDispatch();

  const isAuthenticated = authenticatedUser != null;

  const formShape = {
    subject: Yup.string().required('Required'),
    problem_description: Yup.string().required('Required'),
    first_name: Yup.string().required('Required'),
    last_name: Yup.string().required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    cc: Yup.array()
      .transform((value, originalValue) => {
        if (Yup.string().email().isType(value) && value !== null) {
          return value;
        }
        return originalValue ? originalValue.split(/[\s,]+/) : [];
      })
      .of(Yup.string().email('Invalid email')),
  };

  if (!isAuthenticated && recaptchaSiteKey) {
    formShape.recaptchaResponse = Yup.string().required('Required');
  }

  const formSchema = Yup.object().shape(formShape);

  return (
    <Formik
      validateOnMount
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
          type: 'TICKET_CREATE',
          payload: {
            formData,
            resetSubmittedForm: resetForm,
            refreshTickets: isAuthenticated,
          },
        });
      }}
    >
      {({ isSubmitting, isValid, setFieldValue }) => {
        return (
          <Form className="ticket-create-form">
            <ModalBody className="ticket-create-modal-body">
              <FormGroup>
                <FormField name="subject" label="Subject" required />
                <FormField
                  name="problem_description"
                  label="Problem Description"
                  className="ticket-description-text-area"
                  type="textarea"
                  required
                  description="Explain your steps leading up to the problem and include any error
            reports"
                />
                <FileInputDropZoneFormField
                  id="attachments"
                  isSubmitted={isSubmitting}
                  description="Error reports and screenshots can be helpful for diagnostics"
                  maxSizeMessage={maxSizeMessage || 'Max File Size: 3MB'}
                  maxSize={maxSize || 3145728}
                />
                <Container>
                  <Row>
                    <Col lg="6">
                      <FormField
                        name="first_name"
                        label="First Name"
                        required
                        disabled={isAuthenticated}
                      />
                    </Col>
                    <Col lg="6">
                      <FormField
                        name="last_name"
                        label="Last Name"
                        required
                        disabled={isAuthenticated}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col lg="6">
                      <FormField
                        name="email"
                        label="Email"
                        required
                        disabled={isAuthenticated}
                      />
                    </Col>
                    <Col lg="6">
                      <FormField
                        name="cc"
                        label="Cc"
                        description="Separate emails with commas. NOTE: Emails listed here will only receive emails on replies to tickets."
                      />
                    </Col>
                  </Row>
                  {!isAuthenticated && recaptchaSiteKey && (
                    <ReCAPTCHA
                      name="recaptcha"
                      sitekey={recaptchaSiteKey}
                      onChange={(e) => {
                        setFieldValue('recaptchaResponse', e);
                      }}
                    />
                  )}
                </Container>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <div className="ticket-create-button-row">
                {creatingSuccess && (
                  <CreatedTicketInformation
                    ticketId={createdTicketId}
                    provideDashBoardLinkOnSuccess={
                      isAuthenticated && provideDashBoardLinkOnSuccess
                    }
                  />
                )}
                {creatingError && (
                  <Alert color="warning">
                    Ticket creating error: {creatingErrorMessage}
                  </Alert>
                )}
                <Button
                  attr="submit"
                  type="primary"
                  size="medium"
                  disabled={!isValid || isSubmitting || creating}
                  isLoading={creating}
                >
                  Add Ticket
                </Button>
              </div>
            </ModalFooter>
          </Form>
        );
      }}
    </Formik>
  );
}

TicketCreateForm.propTypes = {
  /** provide link to dashboard tickets when creating a ticket */
  provideDashBoardLinkOnSuccess: PropTypes.bool.isRequired,
  /** initial subject for ticket */
  initialSubject: PropTypes.string,
  /** authenticated user */
  authenticatedUser: PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    email: PropTypes.string,
    isStaff: PropTypes.bool,
    oauth: PropTypes.shape({}),
  }),
};

TicketCreateForm.defaultProps = {
  authenticatedUser: null,
  initialSubject: '',
};

export default TicketCreateForm;
