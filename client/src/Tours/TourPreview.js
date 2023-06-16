import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import './TourPreview.scss';
import Api from '../Api';
import StopViewer from '../Components/Viewer/StopViewer';

function TourPreview() {
  const navigate = useNavigate();
  const { TourId, TourStopId } = useParams();
  const [Tour, setTour] = useState();
  const [TourStops, setTourStops] = useState();
  const [TourStop, setTourStop] = useState();
  const [position, setPosition] = useState(0);
  const [variant, setVariant] = useState();

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
          setPosition(0);
        });
    } else {
      setTourStop(undefined);
      setPosition(0);
    }
    return () => (isCancelled = true);
  }, [TourId, TourStopId]);

  function onEnded() {
    if (TourStopId) {
      let index = TourStops.findIndex((ts) => ts.id === TourStopId) + 1;
      if (index < TourStops.length) {
        navigate(TourStops[index].id);
      }
    } else {
      navigate(`stops/${TourStops[0].id}`);
    }
  }

  function onSelect(ts) {
    if (TourStopId) {
      if (ts) {
        navigate(`../stops/${ts.id}`);
      } else {
        navigate('..');
      }
    } else if (ts) {
      navigate(`stops/${ts.id}`);
    }
  }

  return (
    <div className="tour-preview">
      {variant && TourStop && (
        <StopViewer
          autoPlay={true}
          controls={true}
          tour={Tour}
          tourStops={TourStops}
          stop={TourStop.Stop}
          variant={variant}
          onEnded={onEnded}
          onSelect={onSelect}
          position={position}
          onTimeUpdate={setPosition}
        />
      )}
      {variant && !TourStop && Tour?.IntroStop && (
        <StopViewer
          controls={true}
          tour={Tour}
          tourStops={TourStops}
          stop={Tour.IntroStop}
          variant={variant}
          onEnded={onEnded}
          onSelect={onSelect}
          position={position}
          onTimeUpdate={setPosition}
        />
      )}
    </div>
  );
}

export default TourPreview;
