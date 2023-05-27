import Modal from 'react-bootstrap/Modal';

function ConfirmModal({ isShowing, onCancel, onOK, children }) {
  return (
    <Modal centered show={isShowing} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>Are you sure?</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button onClick={onOK} className="btn btn-primary">
          OK
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmModal;
