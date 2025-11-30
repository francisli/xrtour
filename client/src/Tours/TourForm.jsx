import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusCodes } from 'http-status-codes';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import FormGroup from '../Components/FormGroup';
import LanguageModal from '../Components/LanguageModal';
import UnexpectedError from '../UnexpectedError';
import ValidationError from '../ValidationError';
import VariantTabs from '../Components/VariantTabs';
import { useStaticContext } from '../StaticContext';

function TourForm() {
  const staticContext = useStaticContext();
  const navigate = useNavigate();
  const { membership } = useAuthContext();
  const { TourId } = useParams();

  const isNew = !TourId;

  const [variant, setVariant] = useState();
  const [tour, setTour] = useState({
    TeamId: '',
    link: '',
    names: {},
    descriptions: {},
    variants: [],
    visibility: 'PRIVATE',
  });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    if (membership && !TourId) {
      setVariant(membership.Team.variants[0]);
      setTour({
        TeamId: membership.TeamId,
        link: '',
        names: { [membership.Team.variants[0].code]: '' },
        descriptions: { [membership.Team.variants[0].code]: '' },
        variants: [membership.Team.variants[0]],
        visibility: 'PRIVATE',
      });
    }
    if (TourId) {
      Api.tours.get(TourId).then((response) => {
        setVariant(response.data.variants[0]);
        setTour(response.data);
      });
    }
  }, [membership, TourId]);

  function onChange(event) {
    const newTour = { ...tour };
    const { name, value } = event.target;
    if (name === 'names' || name === 'descriptions') {
      newTour[name][variant?.code] = value;
    } else if (name === 'variant.displayName') {
      newTour.variants.find((v) => v.code === variant?.code).displayName = value;
    } else {
      newTour[name] = value;
    }
    setTour(newTour);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let response;
      if (TourId) {
        response = await Api.tours.update(TourId, tour);
      } else {
        response = await Api.tours.create(tour);
      }
      navigate(`/teams/${membership.TeamId}/tours/${response.data.id}`);
    } catch (error) {
      if (error.response?.status === StatusCodes.UNPROCESSABLE_ENTITY) {
        setError(new ValidationError(error.response.data));
      } else {
        setError(new UnexpectedError());
      }
    } finally {
      setLoading(false);
    }
  }

  const [isShowingLanguageModal, setShowingLanguageModal] = useState(false);
  function onAddVariant(variant) {
    const newTour = { ...tour };
    newTour.variants.push(variant);
    newTour.names[variant.code] = '';
    newTour.descriptions[variant.code] = '';
    setTour(newTour);
    setShowingLanguageModal(false);
    setVariant(variant);
  }

  function onRemoveVariant(variant) {
    const newTour = { ...tour };
    newTour.variants = tour.variants.filter((v) => v.code !== variant.code);
    delete newTour.names[variant.code];
    delete newTour.descriptions[variant.code];
    setTour(newTour);
    setVariant(tour.variants[0]);
  }

  async function onTranslateVariant(variant) {
    try {
      const source = tour.variants[0].code;
      const target = variant.code;
      const response = await Api.tours.translate(source, target, {
        name: tour.names[source],
        description: tour.descriptions[source],
      });
      const newTour = { ...tour };
      if (!newTour.names[target]) {
        newTour.names[target] = response.data.name;
      }
      if (!newTour.descriptions[target]) {
        newTour.descriptions[target] = response.data.description;
      }
      setTour(newTour);
    } catch {
      setError(new UnexpectedError());
    }
  }

  return (
    <>
      <Helmet>
        <title>
          {isNew ? 'New Tour' : 'Edit Tour'} - {staticContext?.env?.SITE_TITLE}
        </title>
      </Helmet>
      <main className="container">
        <div className="row">
          <div className="col-md-6">
            <h1 className="mb-3">{isNew ? 'New Tour' : 'Edit Tour'}</h1>
            {variant && tour && (
              <form onSubmit={onSubmit}>
                {error && error.message && <div className="alert alert-danger">{error.message}</div>}
                <fieldset disabled={isLoading}>
                  <FormGroup
                    name="name"
                    label="Name"
                    helpText="The name of the Tour as it appears in this Editor"
                    onChange={onChange}
                    value={tour.name}
                    error={error}
                  />
                  <FormGroup
                    name="link"
                    label="Published Link"
                    prefix={`https://${membership?.Team?.link}.xrtour.org/`}
                    helpText="Letters, numbers, and hypen only."
                    onChange={onChange}
                    record={tour}
                    error={error}
                  />
                  <VariantTabs
                    variants={tour.variants}
                    current={variant}
                    setVariant={setVariant}
                    onAdd={() => setShowingLanguageModal(true)}
                  />
                  <FormGroup
                    name="variant.displayName"
                    label="Language Name"
                    helpText="The name of the Language as it appears to the public"
                    onChange={onChange}
                    value={variant.displayName}
                    error={error}
                  />
                  <FormGroup
                    name="names"
                    label="Display Name"
                    helpText="The name of the Tour as it appears to the public"
                    onChange={onChange}
                    value={tour.names[variant?.code]}
                    error={error}
                  />
                  <FormGroup
                    type="textarea"
                    name="descriptions"
                    label="Description"
                    onChange={onChange}
                    value={tour.descriptions[variant?.code]}
                    error={error}
                  />
                  <div className="mb-3 d-flex justify-content-between">
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary" type="submit">
                        Submit
                      </button>
                      {tour.id && (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => navigate(`/teams/${membership.TeamId}/tours/${tour.id}`)}>
                          Cancel
                        </button>
                      )}
                    </div>
                    {variant.code !== tour.variants[0].code && (
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary" type="button" onClick={() => onTranslateVariant(variant)}>
                          Translate
                        </button>
                        <button className="btn btn-outline-danger" type="button" onClick={() => onRemoveVariant(variant)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </fieldset>
              </form>
            )}
          </div>
        </div>
        {isShowingLanguageModal && (
          <LanguageModal onCancel={() => setShowingLanguageModal(false)} onOK={onAddVariant} variants={tour.variants} />
        )}
      </main>
    </>
  );
}
export default TourForm;
