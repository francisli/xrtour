import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStaticContext } from './StaticContext';

import StopViewer from 'shared/Components/Viewer/StopViewer';

import Api from './Api';
import './Home.scss';

function Home() {
  const { TourStopId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { tour } = useStaticContext();
  const [Tour, setTour] = useState(tour);
  const [TourStop, setTourStop] = useState();
  const [variant, setVariant] = useState();

  const [isPlaying, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    if (!Tour) {
      Api.getData().then((response) => {
        if (isCancelled) return;
        setTour(response.data);
      });
    }
    return () => (isCancelled = true);
  }, [Tour]);

  useEffect(() => {
    if (Tour) {
      if (!variant) {
        setVariant(Tour.variants[0]);
      }
      if (TourStopId) {
        setTourStop(Tour.TourStops.find((ts) => ts.id === TourStopId));
      } else {
        setTourStop();
      }
    }
  }, [variant, Tour, TourStopId]);

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
      let index = Tour.TourStops.findIndex((ts) => ts.id === TourStopId) + 1;
      if (index < Tour.TourStops.length) {
        navigate(`../stops/${Tour.TourStops[index].id}?position=0`);
      }
    } else {
      navigate(`stops/${Tour.TourStops[0].id}?position=0`);
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

  const title = Tour?.names?.[Tour?.variants?.[0].code] ?? '';
  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="home">
        {Tour && variant && (
          <StopViewer
            autoPlay={!!TourStop && isPlaying}
            controls={true}
            tour={Tour}
            tourStops={Tour.TourStops}
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
    </>
  );
}

export default Home;
