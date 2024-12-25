import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import StopViewer from 'shared/Components/Viewer/StopViewer';

import Api from './Api';
import { useStaticContext } from './StaticContext';
import './Home.scss';

function Home() {
  const { TourLink, TourStopId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { env, tour } = useStaticContext();
  const [Tour, setTour] = useState(tour?.link.toLowerCase() === TourLink?.toLowerCase() ? tour : undefined);
  const [TourStop, setTourStop] = useState();
  const [variant, setVariant] = useState();

  const [isPlaying, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    if (!Tour) {
      Api.getData(TourLink).then((response) => {
        if (isCancelled) return;
        setTour(response.data);
      });
    }
    return () => (isCancelled = true);
  }, [TourLink, Tour]);

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
      Api.post('Page Viewed', {
        $referrer: document.referrer,
        current_page_title: document.title,
        current_domain: window.location.hostname,
        current_url_path: window.location.pathname,
        current_url_protocol: window.location.protocol,
        current_url_search: window.location.search,
      });
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
        if (newIsPlaying) {
          navigate(`/${TourLink}/stops/${Tour.TourStops[index].id}?position=0`);
        }
      } else {
        Api.post('Tour Completed', {
          $referrer: document.referrer,
          current_page_title: document.title,
          current_domain: window.location.hostname,
          current_url_path: window.location.pathname,
          current_url_protocol: window.location.protocol,
          current_url_search: window.location.search,
        });
      }
    } else {
      navigate(`/${TourLink}/stops/${Tour.TourStops[0].id}?position=0`);
    }
  }

  function onSelect(ts) {
    if (ts) {
      navigate(`/${TourLink}/stops/${ts.id}?position=0`);
    } else {
      navigate(`/${TourLink}?position=0`);
    }
  }

  function onTimeUpdate(position) {
    setPosition(position);
  }

  function onPause() {
    setSearchParams(`position=${position}`);
  }

  const title = Tour?.names?.[Tour?.variants?.[0].code] ?? '';
  const faviconURL = Tour?.Team?.faviconURL;
  const description = Tour?.descriptions?.[Tour?.variants?.[0].code] ?? '';
  const baseURL = env.BASE_URL ?? `${window.location.protocol}//${window.location.host}`;
  const imageURL = `${baseURL}${Tour?.CoverResource?.Files?.find((f) => f.variant === Tour?.CoverResource?.variants?.[0]?.code)?.URL}`;
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <link rel="icon" href={faviconURL} />
        <meta property="og:image" content={imageURL} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Helmet>
      <div className="home">
        <div className="home__content">
          {Tour && variant && (
            <StopViewer
              autoPlay={!!TourStop && isPlaying}
              controls={true}
              mapboxAccessToken={env?.MAPBOX_ACCESS_TOKEN}
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
      </div>
    </>
  );
}

export default Home;
