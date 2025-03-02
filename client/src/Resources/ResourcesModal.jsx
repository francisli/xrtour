import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { capitalize } from 'inflection';

import './ResourcesModal.scss';
import ResourcesList from './ResourcesList';
import ResourceForm from './ResourceForm';

function ResourcesModal({ isShowing, onHide, onSelect, types }) {
  const [isEditing, setEditing] = useState(false);
  const [ResourceId, setResourceId] = useState();
  const [type, setType] = useState();
  const [refreshToken, setRefreshToken] = useState(0);

  function onNew(newType) {
    setResourceId(undefined);
    setType(newType);
    setEditing(true);
  }

  function onEdit(resource) {
    setResourceId(resource.id);
    setType(resource.type);
    setEditing(true);
  }

  function onCreate(resource) {
    setEditing(false);
    onSelect(resource);
  }

  function onUpdate() {
    setEditing(false);
    setRefreshToken(refreshToken + 1);
  }

  return (
    <Modal show={isShowing} onHide={onHide} size="xl" dialogClassName="resources-modal">
      <Modal.Header closeButton>
        <Modal.Title>{types?.length === 1 && `${capitalize(types[0])} `}Assets</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isEditing && (
          <ResourcesList type={type} types={types} onNew={onNew} onSelect={onSelect} onEdit={onEdit} refreshToken={refreshToken} />
        )}
        {isEditing && (
          <ResourceForm ResourceId={ResourceId} type={type} onCancel={() => setEditing(false)} onCreate={onCreate} onUpdate={onUpdate} />
        )}
      </Modal.Body>
    </Modal>
  );
}

ResourcesModal.propTypes = {
  isShowing: PropTypes.bool,
  onHide: PropTypes.func,
  onSelect: PropTypes.func,
  types: PropTypes.array,
};

export default ResourcesModal;
