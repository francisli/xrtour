import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

import PhoneScreen from 'shared/Components/Viewer/PhoneScreen';
import StopViewer from 'shared/Components/Viewer/StopViewer';

import Api from '../Api';
import FormGroup from '../Components/FormGroup';
import VariantTabs from '../Components/VariantTabs';
import Recorder from '../Resources/Recorder';
import ResourcesModal from '../Resources/ResourcesModal';
import ResourcesTable from '../Resources/ResourcesTable';
import { useStaticContext } from '../StaticContext';
import { useAuthContext } from '../AuthContext';

function resourceSortComparator(r1, r2) {
  let result = r1.Resource.type.localeCompare(r2.Resource.type);
  if (result === 0) {
    result = Math.sign(r1.start - r2.start);
    if (result === 0) {
      result = r1.Resource.name.localeCompare(r2.Resource.name);
    }
  }
  return result;
}

function Stop({ StopId, transition, children }) {
  const { membership } = useAuthContext();
  const staticContext = useStaticContext();
  const { StopId: StopIdParam, TourId } = useParams();
  const [tour, setTour] = useState();
  const [stop, setStop] = useState();
  const [variant, setVariant] = useState();
  const [resources, setResources] = useState();

  useEffect(() => {
    let isCancelled = false;
    if (TourId) {
      Api.tours.get(TourId).then((response) => {
        if (isCancelled) return;
        setTour(response.data);
      });
    }
    return () => (isCancelled = true);
  }, [TourId]);

  useEffect(() => {
    let isCancelled = false;
    if (StopId || StopIdParam) {
      let newStop;
      Api.stops
        .get(StopId ?? StopIdParam)
        .then((response) => {
          if (isCancelled) return;
          newStop = response.data;
          setStop(newStop);
          setVariant(response.data.variants[0]);
          return Api.stops.resources(StopId ?? StopIdParam).index();
        })
        .then((response) => {
          if (isCancelled) return;
          newStop.Resources = response.data;
          setStop({ ...newStop });
          setResources(response.data);
        });
    }
    return () => (isCancelled = true);
  }, [StopId, StopIdParam]);

  const [isRecording, setRecording] = useState(false);
  const [position, setPosition] = useState(0);
  const [isShowingResourcesModal, setShowingResourcesModal] = useState(false);

  function onHideResourcesModal() {
    setShowingResourcesModal(false);
  }

  async function onSelectResource(resource) {
    const response = await Api.stops.resources(stop.id).create({
      ResourceId: resource.id,
    });
    const newResources = [...resources, response.data];
    newResources.sort(resourceSortComparator);
    setResources(newResources);
    setStop({ ...stop, Resources: newResources });
    setShowingResourcesModal(false);
  }

  function onClickResource(resource) {
    setPosition(resource.start);
  }

  async function onChangeResource(resource) {
    await Api.stops.resources(stop.id).update(resource.id, resource);
    const newResources = [...resources];
    newResources.sort(resourceSortComparator);
    setResources(newResources);
    setStop({ ...stop, Resources: newResources });
  }

  async function onRemoveResource(resource) {
    await Api.stops.resources(stop.id).remove(resource.id);
    const newResources = [...resources];
    const index = newResources.indexOf(resource);
    newResources.splice(index, 1);
    setResources(newResources);
    setStop({ ...stop, Resources: newResources });
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
          {title} - {staticContext?.env?.SITE_TITLE}
        </title>
      </Helmet>
      <main className="container">
        {!stop && <div className="spinner-border"></div>}
        {!!stop && (
          <>
            <div className="row">
              <div className="col-md-7">
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/">Home</Link>
                    </li>
                    <li className="breadcrumb-item">
                      <Link to={`/teams/${tour?.TeamId}/tours/${tour?.id}`}>{tour?.names[tour?.variants[0].code]}</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      {title}
                    </li>
                  </ol>
                </nav>
                <h1 className="mb-3">{title}</h1>
                <form className="mb-5">
                  {stop.type === 'STOP' && (
                    <>
                      <FormGroup plaintext name="link" label="Link" record={stop} />
                      <FormGroup plaintext name="address" label="Address" record={stop} />
                    </>
                  )}
                  {stop.type === 'TRANSITION' && (
                    <>
                      <FormGroup plaintext name="address" label="Starting Address" record={stop} />
                      <FormGroup plaintext name="destAddress" label="Destination Address" record={stop} />
                    </>
                  )}
                  <VariantTabs variants={stop.variants} current={variant} setVariant={setVariant} />
                  <FormGroup plaintext name="name" label="Name" value={stop.names[variant.code]} />
                  <FormGroup plaintext type="textarea" name="description" label="Description" value={stop.descriptions[variant.code]} />
                  <div className="mb-3">
                    {membership.role !== 'VIEWER' && (
                      <>
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
                      </>
                    )}
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
                <div className="mb-5">
                  {membership.role !== 'VIEWER' && (
                    <button onClick={() => setShowingResourcesModal(true)} type="button" className="btn btn-primary">
                      Add Asset
                    </button>
                  )}
                </div>
                {children}
              </div>
              <div className="col-md-5">
                <PhoneScreen className="mx-auto">
                  <PhoneScreen className="position-fixed">
                    <StopViewer
                      position={position}
                      stop={stop}
                      transition={transition}
                      variant={variant}
                      onTimeUpdate={(newPosition) => setPosition(newPosition)}
                    />
                  </PhoneScreen>
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

Stop.propTypes = {
  StopId: PropTypes.string,
  transition: PropTypes.object,
  children: PropTypes.node,
};

export default Stop;
