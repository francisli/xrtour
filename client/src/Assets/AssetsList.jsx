import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';

import { useStaticContext } from '../StaticContext';
import ResourceForm from '../Resources/ResourceForm';
import ResourcesList from '../Resources/ResourcesList';

function AssetsList() {
  const staticContext = useStaticContext();

  const [isEditing, setEditing] = useState(false);
  const [ResourceId, setResourceId] = useState();
  const [type, setType] = useState();

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
  }

  function onUpdate() {
    setEditing(false);
  }

  return (
    <>
      <Helmet>
        <title>Assets - {staticContext?.env?.SITE_TITLE}</title>
      </Helmet>
      <main className="container">
        <ResourcesList onNew={onNew} onEdit={onEdit} />
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

export default AssetsList;
