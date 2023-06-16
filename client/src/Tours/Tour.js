import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import QRCode from 'react-qr-code';
import inflection from 'inflection';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import { useStaticContext } from '../StaticContext';
import FormGroup from '../Components/FormGroup';
import VariantTabs from '../Components/VariantTabs';
import ResourcesModal from '../Resources/ResourcesModal';
import StopsModal from '../Stops/StopsModal';
import StopsTable from '../Stops/StopsTable';
import SharePreview from '../Components/SharePreview';

function Tour() {
  const { membership } = useAuthContext();
  const staticContext = useStaticContext();
  const navigate = useNavigate();
  const { TourId } = useParams();
  const [tour, setTour] = useState();
  const [variant, setVariant] = useState();
  const [stops, setStops] = useState();

  useEffect(() => {
    let isCancelled = false;
    Api.tours
      .get(TourId)
      .then((response) => {
        if (isCancelled) return;
        setTour(response.data);
        setVariant(response.data.variants[0]);
        return Api.tours.stops(TourId).index();
      })
      .then((response) => {
        if (isCancelled) return;
        setStops(response.data);
      });
    return () => (isCancelled = true);
  }, [TourId]);

  const [isShowingResourcesModal, setShowingResourcesModal] = useState(false);

  function onHideResourcesModal() {
    setShowingResourcesModal(false);
  }

  async function onSelectResource(resource) {
    await Api.tours.update(tour.id, { CoverResourceId: resource.id });
    const newTour = { ...tour };
    newTour.CoverResource = resource;
    setTour(newTour);
    setShowingResourcesModal(false);
  }

  const [stopType, setStopType] = useState('STOP');
  const [isShowingStopsModal, setShowingStopsModal] = useState(false);

  function onHideStopsModal() {
    setShowingStopsModal(false);
  }

  async function onSelectStop(stop) {
    if (stop.type === 'INTRO') {
      await Api.tours.update(tour.id, { IntroStopId: stop.id });
      const newTour = { ...tour };
      newTour.IntroStop = stop;
      newTour.IntroStopId = stop.id;
      setTour(newTour);
    } else if (stop.type === 'STOP') {
      const response = await Api.tours.stops(TourId).create({
        StopId: stop.id,
        position: stops.reduce((max, current) => Math.max(max, current), 0) + 1,
      });
      const newStops = [...stops, response.data];
      setStops(newStops);
    }
    setShowingStopsModal(false);
  }

  function onClickStop(type, stop) {
    navigate(`${inflection.pluralize(type).toLocaleLowerCase()}/${stop.id}`);
  }

  async function onRemoveIntro() {
    await Api.tours.update(tour.id, { IntroStopId: null });
    const newTour = { ...tour };
    newTour.IntroStop = null;
    setTour(newTour);
  }

  async function onRemoveStop(stop) {
    await Api.tours.stops(tour.id).remove(stop.id);
    const newStops = [...stops];
    const index = newStops.indexOf(stop);
    newStops.splice(index, 1);
    setStops(newStops);
  }

  async function onReorderStops(newStops) {
    if (JSON.stringify(stops) !== JSON.stringify(newStops)) {
      setStops(newStops);
      await Api.tours.stops(tour.id).reorder({ TourStops: newStops.map((ts, i) => ({ id: ts.id, position: i + 1 })) });
    }
  }

  const previewPopover = (
    <Popover>
      <Popover.Body>
        <QRCode
          size={244}
          value={`${window.location.protocol}//${window.location.host}/teams/${membership?.TeamId}/tours/${TourId}/preview`}
        />
      </Popover.Body>
    </Popover>
  );

  return (
    <>
      <Helmet>
        <title>
          {tour?.names[tour.variants[0].code] ?? ''} - {staticContext.env.REACT_APP_SITE_TITLE}
        </title>
      </Helmet>
      <main className="container">
        {!tour && <div className="spinner-border"></div>}
        {tour && (
          <>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb">
                <li class="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li class="breadcrumb-item active" aria-current="page">
                  {tour.names[tour.variants[0].code]}
                </li>
              </ol>
            </nav>
            <h1 className="mb-3">{tour.names[tour.variants[0].code]}</h1>
            <div className="row">
              <div className="col-md-6">
                <form className="mb-5">
                  <FormGroup plaintext name="link" label="Link" record={tour} />
                  <VariantTabs variants={tour.variants} current={variant} setVariant={setVariant} />
                  <FormGroup plaintext name="name" label="Name" value={tour.names[variant.code]} />
                  <FormGroup plaintext name="description" label="Description" value={tour.descriptions[variant.code]} />
                  <div className="mb-3">
                    {membership.role !== 'VIEWER' && (
                      <Link className="btn btn-primary me-2" to="edit">
                        Edit
                      </Link>
                    )}
                    <OverlayTrigger trigger="hover" placement="right" overlay={previewPopover}>
                      <a
                        className="btn btn-secondary"
                        href={`/teams/${membership?.TeamId}/tours/${TourId}/preview`}
                        rel="noreferrer"
                        target="_blank">
                        Preview
                      </a>
                    </OverlayTrigger>
                  </div>
                </form>
                <div className="row mb-5">
                  <div className="col-md-6">
                    <h2>Cover</h2>
                    {tour.CoverResource && (
                      <div className="row">
                        <div className="col-6">
                          <img
                            className="img-thumbnail mb-3"
                            src={tour.CoverResource.Files.find((f) => f.variant === variant.code)?.URL}
                            alt="Cover"
                          />
                        </div>
                      </div>
                    )}
                    {membership.role !== 'VIEWER' && (
                      <button onClick={() => setShowingResourcesModal(true)} type="button" className="btn btn-primary">
                        Select Cover
                      </button>
                    )}
                  </div>
                </div>
                <h2>Intro</h2>
                <StopsTable
                  type="INTRO"
                  stops={tour.IntroStop ? [{ id: tour.IntroStopId, Stop: tour.IntroStop }] : []}
                  onClick={onClickStop}
                  onRemove={onRemoveIntro}
                />
                <div className="mb-5">
                  {membership.role !== 'VIEWER' && (
                    <button
                      onClick={() => {
                        setStopType('INTRO');
                        setShowingStopsModal(true);
                      }}
                      type="button"
                      className="btn btn-primary">
                      Set Intro
                    </button>
                  )}
                </div>
                <h2>Stops</h2>
                <StopsTable stops={stops} onClick={onClickStop} onRemove={onRemoveStop} onReorderStops={onReorderStops} />
                <div className="mb-5">
                  {membership.role !== 'VIEWER' && (
                    <button
                      onClick={() => {
                        setStopType('STOP');
                        setShowingStopsModal(true);
                      }}
                      type="button"
                      className="btn btn-primary">
                      Add Stop
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-4 offset-md-1">
                <SharePreview tour={tour} />
              </div>
            </div>
          </>
        )}
        <ResourcesModal isShowing={isShowingResourcesModal} onHide={onHideResourcesModal} onSelect={onSelectResource} types={['IMAGE']} />
        <StopsModal type={stopType} isShowing={isShowingStopsModal} onHide={onHideStopsModal} onSelect={onSelectStop} />
      </main>
    </>
  );
}
export default Tour;
