import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import StopViewer from 'shared/Components/Viewer/StopViewer';

import Api from '../Api';
import { useStaticContext } from '../StaticContext';
import { useAuthContext } from '../AuthContext';

import './TourPreview.scss';

function TourPreview() {
  const { membership } = useAuthContext();
  const staticContext = useStaticContext();
  const navigate = useNavigate();
  const { TourId, TourStopId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [position, setPosition] = useState(0);
  const [Tour, setTour] = useState();
  const [TourStops, setTourStops] = useState();
  const [TourStop, setTourStop] = useState();

  const [variant, setVariant] = useState();
  const [isPlaying, setPlaying] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    if (TourId) {
      let newTour;
      Api.tours
        .get(TourId)
        .then((response) => {
          if (isCancelled) return;
          newTour = response.data;
          return Api.tours.stops(TourId).index();
        })
        .then((response) => {
          if (isCancelled) return;
          setTour(newTour);
          setVariant(newTour.variants[0]);
          setTourStops(response.data);
        });
    }
    return () => (isCancelled = true);
  }, [TourId]);

  useEffect(() => {
    let isCancelled = false;
    if (TourStopId) {
      let newTourStop;
      Api.tours
        .stops(TourId)
        .get(TourStopId)
        .then((response) => {
          if (isCancelled) return;
          newTourStop = response.data;
          return Api.stops.resources(newTourStop.StopId).index();
        })
        .then((response) => {
          if (isCancelled) return;
          newTourStop.Stop.Resources = response.data;
          setTourStop(newTourStop);
        });
    } else {
      setTourStop(undefined);
    }
    return () => (isCancelled = true);
  }, [TourId, TourStopId]);

  useEffect(() => {
    let newPosition = searchParams.get('position');
    if (newPosition !== null) {
      newPosition = parseInt(newPosition, 10);
      if (position !== newPosition) {
        setPosition(newPosition);
        setSearchParams();
      }
    }
  }, [position, searchParams, setSearchParams]);

  function onEnded(newIsPlaying) {
    setPlaying(newIsPlaying);
    if (TourStopId) {
      let index = TourStops.findIndex((ts) => ts.id === TourStopId) + 1;
      if (index < TourStops.length) {
        if (newIsPlaying) {
          navigate(`../stops/${TourStops[index].id}?position=0`);
        }
      }
    } else {
      navigate(`stops/${TourStops[0].id}?position=0`);
    }
  }

  function onSelect(ts) {
    if (TourStopId) {
      if (ts) {
        navigate(`../stops/${ts.id}?position=0`);
      } else {
        navigate('..?position=0');
      }
    } else if (ts) {
      navigate(`stops/${ts.id}?position=0`);
    }
  }

  function onTimeUpdate(position) {
    setPosition(position);
  }

  function onPause() {
    setSearchParams(`position=${position}`);
  }

  return (
    <>
      <Helmet>
        <title>
          {Tour?.names[Tour?.variants[0].code] ?? ''} Preview - {staticContext?.env?.SITE_TITLE}
        </title>
      </Helmet>
      <div className="tour-preview">
        <div className="tour-preview__content">
          {Tour && variant && (
            <StopViewer
              autoPlay={!!TourStop && isPlaying}
              controls={true}
              mapboxAccessToken={staticContext?.env?.MAPBOX_ACCESS_TOKEN}
              team={membership?.Team}
              tour={Tour}
              tourStops={TourStops}
              stop={TourStop ? TourStop.Stop : Tour.IntroStop}
              transition={TourStop?.TransitionStop}
              variant={variant}
              onEnded={onEnded}
              onSelect={onSelect}
              position={position}
              onTimeUpdate={onTimeUpdate}
              onPause={onPause}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default TourPreview;
