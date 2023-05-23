import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Api from '../Api';
import FormGroup from '../Components/FormGroup';
import ResourcesModal from '../Resources/ResourcesModal';
import VariantTabs from '../Components/VariantTabs';

function Tour() {
  const { TourId } = useParams();
  const [tour, setTour] = useState();
  const [variant, setVariant] = useState();
  const [resources, setResources] = useState();
  const [stops, setStops] = useState();

  useEffect(() => {
    let isCancelled = false;
    Api.tours.get(TourId).then((response) => {
      if (isCancelled) return;
      setTour(response.data);
      setVariant(response.data.variants[0]);
    });
    return () => (isCancelled = true);
  }, [TourId]);

  const [isShowingResourcesModal, setShowingResourcesModal] = useState(false);

  function onHideResourcesModal() {
    setShowingResourcesModal(false);
  }

  function onSelectResource(resource) {
    setShowingResourcesModal(false);
  }

  return (
    <main className="container">
      {!tour && <div className="spinner-border"></div>}
      {tour && (
        <>
          <div className="row">
            <div className="col-md-6">
              <h1 className="mb-3">{tour.names[tour.variants[0].code]}</h1>
              <form>
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
              <h2>Assets</h2>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {!resources && (
                    <tr>
                      <td colSpan="4">
                        <div className="spinner-border"></div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mb-3">
                <button onClick={() => setShowingResourcesModal(true)} type="button" className="btn btn-primary">
                  Add Asset
                </button>
              </div>
              <h2>Stops</h2>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {!stops && (
                    <tr>
                      <td colSpan="4">
                        <div className="spinner-border"></div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mb-3">
                <button type="button" className="btn btn-primary">
                  Add Stop
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <ResourcesModal isShowing={isShowingResourcesModal} onHide={onHideResourcesModal} onSelect={onSelectResource} />
    </main>
  );
}
export default Tour;
