import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { useAuthContext } from '../AuthContext';
import { useStaticContext } from '../StaticContext';

import StopsList from '../Stops/StopsList';

function TeamStopsList() {
  const { membership } = useAuthContext();
  const staticContext = useStaticContext();
  const navigate = useNavigate();

  const title = `${membership?.Team?.name ?? ''} - Stops`;

  function onEditStop(stop) {
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
        <StopsList type="STOP" onEdit={onEditStop} />
      </main>
    </>
  );
}

export default TeamStopsList;
