import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { capitalize } from 'inflection';

import { useAuthContext } from '../AuthContext';
import { useStaticContext } from '../StaticContext';

import StopForm from '../Stops/StopForm';
import StopsList from '../Stops/StopsList';

function TeamStopsList() {
  const { membership } = useAuthContext();
  const staticContext = useStaticContext();
  const navigate = useNavigate();

  const [isEditing, setEditing] = useState(false);
  const [type, setType] = useState();
  const [refreshToken, setRefreshToken] = useState(0);

  const title = `${membership?.Team?.name ?? ''} - Stops`;

  function onEditStop(stop) {
    navigate(`${stop.id}`);
  }

  function onNewStop(newType) {
    setType(newType);
    setEditing(true);
  }

  function onCreate(stop) {
    setEditing(false);
    setRefreshToken(refreshToken + 1);
    navigate(`${stop.id}`);
  }

  function onUpdate(stop) {
    setEditing(false);
    setRefreshToken(refreshToken + 1);
    navigate(`${stop.id}`);
  }

  return (
    <>
      <Helmet>
        <title>
          {title} - {staticContext?.env?.SITE_TITLE}
        </title>
      </Helmet>
      <main className="container">
        <h1 className="mb-3">{title}</h1>
        <StopsList type="STOP" onEdit={onEditStop} onNewStop={onNewStop} refreshToken={refreshToken} />
      </main>
      {isEditing && (
        <Modal show={true} onHide={() => setEditing(false)} size="xl" dialogClassName="resources-modal">
          <Modal.Header closeButton>
            <Modal.Title>New {capitalize(type)}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <StopForm type={type} onCancel={() => setEditing(false)} onCreate={onCreate} onUpdate={onUpdate} />
          </Modal.Body>
        </Modal>
      )}
    </>
  );
}

export default TeamStopsList;
