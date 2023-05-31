import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Api from '../Api';
import { useStaticContext } from '../StaticContext';
import FormGroup from '../Components/FormGroup';
import PhoneScreen from '../Components/Viewer/PhoneScreen';
import VariantTabs from '../Components/VariantTabs';
import ResourcesModal from '../Resources/ResourcesModal';
import StopsModal from '../Stops/StopsModal';
import StopsTable from '../Stops/StopsTable';

function Tour() {
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

  const [isShowingStopsModal, setShowingStopsModal] = useState(false);

  function onHideStopsModal() {
    setShowingStopsModal(false);
  }

  async function onSelectStop(stop) {
    const response = await Api.tours.stops(TourId).create({
      StopId: stop.id,
      position: stops.reduce((max, current) => Math.max(max, current), 0) + 1,
    });
    const newStops = [...stops, response.data];
    setStops(newStops);
    setShowingStopsModal(false);
  }

  function onClickStop(stop) {
    navigate(`stops/${stop.id}`);
  }

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
            <div className="row">
              <div className="col-md-6">
                <h1 className="mb-3">{tour.names[tour.variants[0].code]}</h1>
                <form className="mb-5">
                  <FormGroup plaintext name="link" label="Link" record={tour} />
                  <VariantTabs variants={tour.variants} current={variant} setVariant={setVariant} />
                  <FormGroup plaintext name="name" label="Name" value={tour.names[variant.code]} />
                  <FormGroup plaintext name="description" label="Description" value={tour.descriptions[variant.code]} />
                  <div className="mb-3">
                    <Link className="btn btn-primary" to="edit">
                      Edit
                    </Link>
                  </div>
                </form>
                <h2>Cover</h2>
                <div className="mb-5">
                  {tour.CoverResource && (
                    <div className="row">
                      <div className="col-3">
                        <img
                          className="img-thumbnail mb-3"
                          src={tour.CoverResource.Files.find((f) => f.variant === variant.code)?.URL}
                          alt="Cover"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <button onClick={() => setShowingResourcesModal(true)} type="button" className="btn btn-primary">
                      Select Asset
                    </button>
                  </div>
                </div>
                <h2>Stops</h2>
                <StopsTable stops={stops} onClickStop={onClickStop} />
                <div className="mb-5">
                  <button onClick={() => setShowingStopsModal(true)} type="button" className="btn btn-primary">
                    Add Stop
                  </button>
                </div>
              </div>
              <div className="col-md-6">
                <PhoneScreen className="mx-auto"></PhoneScreen>
              </div>
            </div>
          </>
        )}
        <ResourcesModal isShowing={isShowingResourcesModal} onHide={onHideResourcesModal} onSelect={onSelectResource} types={['IMAGE']} />
        <StopsModal isShowing={isShowingStopsModal} onHide={onHideStopsModal} onSelect={onSelectStop} />
      </main>
    </>
  );
}
export default Tour;
