import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { transform } from 'inflection';
import PropTypes from 'prop-types';

import './StopsModal.scss';
import StopsList from './StopsList';
import StopForm from './StopForm';

function StopsModal({ type, types, isShowing, onHide, onSelect, startingAddress }) {
  const [isEditing, setEditing] = useState(false);
  const [StopId, setStopId] = useState();

  function onNewStop() {
    setStopId(undefined);
    setEditing(true);
  }

  function onCreate(stop) {
    setEditing(false);
    onSelect(stop);
  }

  function onUpdate() {
    setEditing(false);
  }

  return (
    <Modal show={isShowing} onHide={onHide} size="xl" dialogClassName="resources-modal">
      <Modal.Header closeButton>
        <Modal.Title>{transform(type, ['pluralize', 'capitalize'])}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isEditing && <StopsList type={type} types={types} onNewStop={onNewStop} onSelect={onSelect} />}
        {isEditing && (
          <StopForm
            type={type}
            StopId={StopId}
            onCancel={() => setEditing(false)}
            onCreate={onCreate}
            onUpdate={onUpdate}
            startingAddress={startingAddress}
          />
        )}
      </Modal.Body>
    </Modal>
  );
}

StopsModal.propTypes = {
  type: PropTypes.string,
  types: PropTypes.arrayOf(PropTypes.string),
  isShowing: PropTypes.bool,
  onHide: PropTypes.func,
  onSelect: PropTypes.func,
  startingAddress: PropTypes.string,
};

export default StopsModal;
