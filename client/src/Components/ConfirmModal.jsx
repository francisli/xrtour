import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';

import './ConfirmModal.scss';

function ConfirmModal({ nested, isShowing, onCancel, onOK, title, children }) {
  let backdropClassName;
  if (nested) {
    backdropClassName = 'confirm-modal__backdrop--nested';
  }
  return (
    <Modal centered show={isShowing} onHide={onCancel ?? onOK} backdropClassName={backdropClassName}>
      <Modal.Header closeButton>
        <Modal.Title>{title ?? 'Are you sure?'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        {!!onCancel && (
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
        {!!onOK && (
          <button onClick={onOK} className="btn btn-primary">
            OK
          </button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

ConfirmModal.propTypes = {
  nested: PropTypes.bool,
  isShowing: PropTypes.bool,
  onCancel: PropTypes.func,
  onOK: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
};

export default ConfirmModal;
