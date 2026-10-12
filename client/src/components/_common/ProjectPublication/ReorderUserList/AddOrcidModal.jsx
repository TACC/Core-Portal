import React from 'react';
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Button } from '_common';
import FormField from '_common/Form/FormField';

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/i;

const validationSchema = Yup.object().shape({
  orcid_id: Yup.string()
    .matches(ORCID_PATTERN, 'Enter a valid ORCID ID (e.g. 0000-0000-0000-0000)')
    .required('ORCID ID is required'),
});

const AddOrcidModal = ({ isOpen, toggle, author, onSave, onClear }) => {
  if (!author) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} className="dataFilesModal">
      <Formik
        initialValues={{ orcid_id: author.orcid_id || '' }}
        validationSchema={validationSchema}
        onSubmit={({ orcid_id }) => {
          onSave(orcid_id);
        }}
        enableReinitialize
      >
        {({ isSubmitting }) => (
          <Form>
            <ModalHeader toggle={toggle}>
              Add ORCID ID for {author.first_name} {author.last_name}
            </ModalHeader>
            <ModalBody>
              <p>
                Learn more about ORCID and look up IDs:{' '}
                <a href="https://orcid.org/" target="_blank" rel="noreferrer">
                  https://orcid.org/
                </a>
              </p>
              <FormField
                name="orcid_id"
                label="ORCID ID"
                placeholder="0000-0000-0000-0000"
                required
              />
            </ModalBody>
            <ModalFooter>
              {author.orcid_id && (
                <Button
                  type="link"
                  onClick={() => {
                    onClear();
                    toggle();
                  }}
                >
                  Clear ORCID ID
                </Button>
              )}
              <Button
                type="primary"
                size="long"
                attr="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                Save
              </Button>
            </ModalFooter>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

AddOrcidModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  author: PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    orcid_id: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default AddOrcidModal;
