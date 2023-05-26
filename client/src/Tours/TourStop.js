import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';

import FormGroup from '../Components/FormGroup';
import VariantTabs from '../Components/VariantTabs';
import { useStaticContext } from '../StaticContext';

import Api from '../Api';

function TourStop() {
  const staticContext = useStaticContext();
  const { TourId, TourStopId } = useParams();

  const [stop, setStop] = useState();
  const [variant, setVariant] = useState();

  useEffect(() => {
    let isCancelled = false;
    Api.tours
      .stops(TourId)
      .get(TourStopId)
      .then((response) => {
        if (isCancelled) return;
        setStop(response.data.Stop);
        setVariant(response.data.Stop.variants[0]);
      });
    return () => (isCancelled = true);
  }, [TourId, TourStopId]);

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
                <form>
                  <FormGroup plaintext name="link" label="Link" record={stop} />
                  <FormGroup plaintext name="address" label="Address" record={stop} />
                  <VariantTabs variants={stop.variants} current={variant} setVariant={setVariant} />
                  <FormGroup plaintext name="name" label="Name" value={stop.names[variant.code]} />
                  <FormGroup plaintext type="textarea" name="description" label="Description" value={stop.descriptions[variant.code]} />
                  <div className="mb-3">
                    <Link className="btn btn-primary" to="edit">
                      Edit
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default TourStop;
