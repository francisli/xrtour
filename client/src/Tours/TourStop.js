import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';

import Api from '../Api';
import FormGroup from '../Components/FormGroup';
import VariantTabs from '../Components/VariantTabs';
import PhoneScreen from '../Components/Viewer/PhoneScreen';
import StopViewer from '../Components/Viewer/StopViewer';
import ResourcesModal from '../Resources/ResourcesModal';
import { useStaticContext } from '../StaticContext';
import ResourcesTable from '../Resources/ResourcesTable';
import Recorder from '../Resources/Recorder';

function TourStop() {
  const staticContext = useStaticContext();
  const { TourId, TourStopId } = useParams();

  const [stop, setStop] = useState();
  const [variant, setVariant] = useState();
  const [resources, setResources] = useState();
  const [isRecording, setRecording] = useState(false);

  const [position, setPosition] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    Api.tours
      .stops(TourId)
      .get(TourStopId)
      .then((response) => {
        if (isCancelled) return;
        setStop(response.data.Stop);
        setVariant(response.data.Stop.variants[0]);
        return Api.stops.resources(response.data.StopId).index();
      })
      .then((response) => {
        if (isCancelled) return;
        setResources(response.data);
      });
    return () => (isCancelled = true);
  }, [TourId, TourStopId]);

  const [isShowingResourcesModal, setShowingResourcesModal] = useState(false);

  function onHideResourcesModal() {
    setShowingResourcesModal(false);
  }

  async function onSelectResource(resource) {
    const response = await Api.stops.resources(stop.id).create({
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
    await Api.stops.resources(stop.id).update(resource.id, resource);
    setResources([...resources]);
  }

  async function onRemoveResource(resource) {
    await Api.stops.resources(stop.id).remove(resource.id);
    const newResources = [...resources];
    const index = newResources.indexOf(resource);
    newResources.splice(index, 1);
    setResources(newResources);
  }

  async function onSaveRecording(blob) {
    const resource = {
      TeamId: stop.TeamId,
      name: stop.names[stop.variants[0].code],
      type: 'AUDIO',
      variants: stop.variants,
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

  const title = stop?.names[stop.variants[0].code] ?? '';

  return (
    <>
      <Helmet>
        <title>
          {title} - {staticContext.env.REACT_APP_SITE_TITLE}
        </title>
      </Helmet>
      <main className="container">
        {!stop && <div className="spinner-border"></div>}
        {!!stop && (
          <>
            <div className="row">
              <div className="col-md-6">
                <h1 className="mb-3">{title}</h1>
                <form className="mb-5">
                  <FormGroup plaintext name="link" label="Link" record={stop} />
                  <FormGroup plaintext name="address" label="Address" record={stop} />
                  <VariantTabs variants={stop.variants} current={variant} setVariant={setVariant} />
                  <FormGroup plaintext name="name" label="Name" value={stop.names[variant.code]} />
                  <FormGroup plaintext type="textarea" name="description" label="Description" value={stop.descriptions[variant.code]} />
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
                  variant={variant}
                  resources={resources}
                  onClick={onClickResource}
                  onChange={onChangeResource}
                  onRemove={onRemoveResource}
                />
                <div className="mb-3">
                  <button onClick={() => setShowingResourcesModal(true)} type="button" className="btn btn-primary">
                    Add Asset
                  </button>
                </div>
              </div>
              <div className="col-md-6">
                <PhoneScreen className="mx-auto">
                  <StopViewer
                    position={position}
                    stop={{ ...stop, Resources: resources }}
                    variant={variant}
                    onTimeUpdate={(newPosition) => setPosition(newPosition)}
                  />
                </PhoneScreen>
              </div>
            </div>
          </>
        )}
        <ResourcesModal isShowing={isShowingResourcesModal} onHide={onHideResourcesModal} onSelect={onSelectResource} />
      </main>
    </>
  );
}

export default TourStop;
