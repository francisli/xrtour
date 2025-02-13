import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';

import { useAuthContext } from '../AuthContext';
import { useStaticContext } from '../StaticContext';
import ResourceForm from '../Resources/ResourceForm';
import ResourcesList from '../Resources/ResourcesList';

function TeamAssetsList() {
  const { membership } = useAuthContext();
  const staticContext = useStaticContext();

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

  function onCreate() {
    setEditing(false);
    setRefreshToken(refreshToken + 1);
  }

  function onUpdate() {
    setEditing(false);
    setRefreshToken(refreshToken + 1);
  }

  return (
    <>
      <Helmet>
        <title>
          {membership?.Team?.name ?? ''} - Assets - {staticContext?.env?.SITE_TITLE}
        </title>
      </Helmet>
      <main className="container">
        <h1 className="mb-3">{membership?.Team?.name ?? ''} - Assets</h1>
        <ResourcesList onNew={onNew} onEdit={onEdit} refreshToken={refreshToken} />
      </main>
      {isEditing && (
        <Modal show={true} onHide={() => setEditing(false)} size="xl" dialogClassName="resources-modal">
          <Modal.Header closeButton>
            <Modal.Title>Assets</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ResourceForm ResourceId={ResourceId} type={type} onCancel={() => setEditing(false)} onCreate={onCreate} onUpdate={onUpdate} />
          </Modal.Body>
        </Modal>
      )}
    </>
  );
}

export default TeamAssetsList;
