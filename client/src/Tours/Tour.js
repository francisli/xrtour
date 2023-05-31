import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Api from '../Api';
import { useStaticContext } from '../StaticContext';
import FormGroup from '../Components/FormGroup';
import PhoneScreen from '../Components/Viewer/PhoneScreen';
import Recorder from '../Resources/Recorder';
import StopViewer from '../Components/Viewer/StopViewer';
import VariantTabs from '../Components/VariantTabs';
import ResourcesModal from '../Resources/ResourcesModal';
import StopsModal from '../Stops/StopsModal';
import ResourcesTable from '../Resources/ResourcesTable';
import StopsTable from '../Stops/StopsTable';

function Tour() {
  const staticContext = useStaticContext();
  const navigate = useNavigate();
  const { TourId } = useParams();
  const [tour, setTour] = useState();
  const [variant, setVariant] = useState();
  const [isRecording, setRecording] = useState(false);
  const [resources, setResources] = useState();
  const [stops, setStops] = useState();
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    Api.tours
      .get(TourId)
      .then((response) => {
        if (isCancelled) return;
        setTour(response.data);
        setVariant(response.data.variants[0]);
        return Promise.all([Api.tours.resources(TourId).index(), Api.tours.stops(TourId).index()]);
      })
      .then((result) => {
        if (isCancelled) return;
        if (result) {
          const [resourcesResponse, stopsResponse] = result;
          setResources(resourcesResponse.data);
          setStops(stopsResponse.data);
        }
      });
    return () => (isCancelled = true);
  }, [TourId]);

  const [isShowingResourcesModal, setShowingResourcesModal] = useState(false);

  function onHideResourcesModal() {
    setShowingResourcesModal(false);
  }

  async function onSelectResource(resource) {
    const response = await Api.tours.resources(TourId).create({
      ResourceId: resource.id,
    });
    const newResources = [...resources, response.data];
    newResources.sort((r1, r2) => {
      let result = r1.Resource.type.localeCompare(r2.Resource.type);
      if (result === 0) {
        result = Math.sign(r1.start - r2.start);
        if (result === 0) {
          result = r1.Resource.name.localeCompare(r2.Resource.name);
        }
      }
      return result;
    });
    setResources(newResources);
    setShowingResourcesModal(false);
  }

  function onClickResource(resource) {
    setPosition(resource.start);
  }

  async function onChangeResource(resource) {
    await Api.tours.resources(tour.id).update(resource.id, resource);
    setResources([...resources]);
  }

  async function onRemoveResource(resource) {
    await Api.tours.resources(tour.id).remove(resource.id);
    const newResources = [...resources];
    const index = newResources.indexOf(resource);
    newResources.splice(index, 1);
    setResources(newResources);
  }

  async function onSaveRecording(blob) {
    const resource = {
      TeamId: tour.TeamId,
      name: tour.names[tour.variants[0].code],
      type: 'AUDIO',
      variants: tour.variants,
      Files: [
        {
          variant: variant.code,
          key: blob.signed_id,
          originalName: blob.filename,
          duration: blob.duration,
        },
      ],
    };
    const response = await Api.resources.create(resource);
    setRecording(false);
    return onSelectResource(response.data);
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
                    {!isRecording && (
                      <>
                        <Link className="btn btn-primary" to="edit">
                          Edit
                        </Link>
                        &nbsp;
                        <button onClick={() => setRecording(true)} className="btn btn-outline-danger" type="button">
                          Record
                        </button>
                      </>
                    )}
                    {isRecording && <Recorder onSave={onSaveRecording} onCancel={() => setRecording(false)} />}
                  </div>
                </form>
                <h2>Assets</h2>
                <ResourcesTable
                  resources={resources}
                  variant={variant}
                  onClick={onClickResource}
                  onChange={onChangeResource}
                  onRemove={onRemoveResource}
                />
                <div className="mb-5">
                  <button onClick={() => setShowingResourcesModal(true)} type="button" className="btn btn-primary">
                    Add Asset
                  </button>
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
                <PhoneScreen className="mx-auto">
                  <StopViewer
                    position={position}
                    stop={{ ...tour, Resources: resources }}
                    variant={variant}
                    onTimeUpdate={(newPosition) => setPosition(newPosition)}
                  />
                </PhoneScreen>
              </div>
            </div>
          </>
        )}
        <ResourcesModal isShowing={isShowingResourcesModal} onHide={onHideResourcesModal} onSelect={onSelectResource} />
        <StopsModal isShowing={isShowingStopsModal} onHide={onHideStopsModal} onSelect={onSelectStop} />
      </main>
    </>
  );
}
export default Tour;
