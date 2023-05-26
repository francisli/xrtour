import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { useStaticContext } from '../StaticContext';
import { useEffect } from 'react';
import Api from '../Api';

function TourStop() {
  const staticContext = useStaticContext();
  const { TourId, TourStopId } = useParams();

  const [tourStop, setTourStop] = useState();
  const [stop, setStop] = useState();

  useEffect(() => {
    let isCancelled = false;
    Api.tours
      .stops(TourId)
      .get(TourStopId)
      .then((response) => {
        if (isCancelled) return;
        setTourStop(response.data);
        setStop(response.data.Stop);
      });
    return () => (isCancelled = true);
  }, [TourId, TourStopId]);

  const title = stop?.names[stop.variants[0].code] ?? '';

  return (
    <>
      <Helmet>
        <title>
          {title} - {staticContext.env.REACT_APP_SITE_TITLE}
        </title>
      </Helmet>
      <main className="container">
        <h1>{title}</h1>
      </main>
    </>
  );
}

export default TourStop;
