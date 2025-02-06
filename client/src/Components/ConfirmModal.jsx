import { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';

import Spinner from './Spinner';
import './ConfirmModal.scss';

function ConfirmModal({ nested, isShowing, onCancel, onOK, title, children }) {
  const [isEnabled, setEnabled] = useState(true);

  useEffect(() => {
    return () => setEnabled(true);
  }, []);

  let backdropClassName;
  if (nested) {
    backdropClassName = 'confirm-modal__backdrop--nested';
  }

  function onClick(callback) {
    setEnabled(false);
    callback();
  }

  return (
    <Modal centered show={isShowing} onHide={onCancel ?? onOK} backdropClassName={backdropClassName}>
      <Modal.Header closeButton>
        <Modal.Title>{title ?? 'Are you sure?'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <fieldset disabled={!isEnabled}>
        <Modal.Footer>
          {!isEnabled && <Spinner />}
          {!!onCancel && (
            <button onClick={() => onClick(onCancel)} className="btn btn-secondary">
              Cancel
            </button>
          )}
          {!!onOK && (
            <button onClick={() => onClick(onOK)} className="btn btn-primary">
              OK
            </button>
          )}
        </Modal.Footer>
      </fieldset>
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
