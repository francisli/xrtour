import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusCodes } from 'http-status-codes';
import classNames from 'classnames';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import FormGroup from '../Components/FormGroup';
import UnexpectedError from '../UnexpectedError';
import ValidationError from '../ValidationError';

function TourForm() {
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
    if (membership) {
      setVariant(membership?.Team?.variants?.[0]);
      setTour({
        TeamId: membership?.TeamId,
        link: '',
        names: membership?.Team?.variants ? { [membership.Team.variants[0]]: '' } : {},
        descriptions: membership?.Team?.variants ? { [membership.Team.variants[0]]: '' } : {},
        variants: membership?.Team?.variants ? [membership.Team.variants[0]] : [],
        visibility: 'PRIVATE',
      });
    }
  }, [membership]);

  function onChange(event) {
    const newTour = { ...tour };
    const { name, value } = event.target;
    if (name === 'name' || name === 'description') {
      newTour[`${name}s`][variant?.code] = value;
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
      navigate(`/tours/${response.data.id}`);
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

  return (
    <main className="container">
      <div className="row justify-content-center">
        <div className="col col-sm-10 col-md-8 col-lg-6 col-xl-4">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">
                {isNew && 'New Tour'}
                {!isNew && 'Edit Tour'}
              </h2>
              <form onSubmit={onSubmit}>
                {error && error.message && <div className="alert alert-danger">{error.message}</div>}
                <fieldset disabled={isLoading}>
                  <FormGroup
                    name="link"
                    label="Link name"
                    helpText="Letters, numbers, and hypen only, to be used in URLs."
                    onChange={onChange}
                    record={tour}
                    error={error}
                  />
                  <ul className="nav nav-tabs mb-3">
                    {tour.variants.map((v) => (
                      <li key={v.code} className="nav-item">
                        <a
                          onClick={() => setVariant(v)}
                          className={classNames('nav-link', { active: v === variant })}
                          aria-current="page"
                          href={`#${v.code}`}>
                          {v.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <FormGroup name="name" label="Name" onChange={onChange} record={tour.names[variant?.code]} error={error} />
                  <FormGroup
                    type="textarea"
                    name="description"
                    label="Description"
                    onChange={onChange}
                    record={tour.names[variant?.code]}
                    error={error}
                  />
                  <div className="mb-3 d-grid">
                    <button className="btn btn-primary" type="submit">
                      Submit
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
export default TourForm;
