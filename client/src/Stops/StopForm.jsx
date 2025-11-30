import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { capitalize } from 'inflection';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuid } from 'uuid';
import PropTypes from 'prop-types';

import { useAuthContext } from '../AuthContext';
import Api from '../Api';
import FormGroup from '../Components/FormGroup';
import UnexpectedError from '../UnexpectedError';
import ValidationError from '../ValidationError';
import VariantTabs from '../Components/VariantTabs';

function StopForm({ StopId, onCancel, onCreate, onUpdate, startingAddress, type, variants }) {
  const { membership } = useAuthContext();
  const { StopId: StopIdParam } = useParams();
  const navigate = useNavigate();

  const [Stop, setStop] = useState();
  const [variant, setVariant] = useState();
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    let isCancelled = false;
    let id = StopId ?? StopIdParam;
    if (membership && !id) {
      const newStop = {
        TeamId: membership.TeamId,
        type,
        link: type !== 'STOP' ? uuid() : '',
        address: startingAddress ?? '',
        destAddress: null,
        names: {},
        descriptions: {},
        variants,
      };
      for (const v of variants) {
        newStop.names[v.code] = '';
        newStop.descriptions[v.code] = '';
      }
      setStop(newStop);
      setVariant(variants[0]);
    }
    if (id) {
      Api.stops.get(id).then((response) => {
        if (isCancelled) return;
        setStop(response.data);
        setVariant(response.data.variants[0]);
      });
    }
    return () => (isCancelled = true);
  }, [membership, StopId, StopIdParam, type, startingAddress, variants]);

  function onChange(event) {
    const newStop = { ...Stop };
    const { name, value } = event.target;
    if (name === 'names' || name === 'descriptions') {
      newStop[name][variant?.code] = value;
    } else if (name === 'address' || name === 'destAddress') {
      const coordinateKey = name.startsWith('dest') ? 'destCoordinate' : 'coordinate';
      newStop[name] = value?.place_name;
      newStop[coordinateKey] = value?.geometry;
    } else {
      newStop[name] = value;
    }
    setStop(newStop);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let response;
      if (Stop.id) {
        response = await Api.stops.update(Stop.id, Stop);
        onUpdate?.(response.data);
      } else {
        response = await Api.stops.create(Stop);
        onCreate?.(response.data);
      }
      if (StopIdParam) {
        navigate(-1);
      }
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

  function onCancelInternal() {
    onCancel?.();
    if (StopIdParam) {
      navigate(-1);
    }
  }

  async function onTranslateVariant(variant) {
    try {
      const source = Stop.variants[0].code;
      const target = variant.code;
      const data = {
        name: Stop.names[source],
        description: Stop.descriptions[source],
      };
      const response = await Api.stops.translate(source, target, data);
      const newStop = { ...Stop };
      if (!newStop.names[target]) {
        newStop.names[target] = response.data.name;
      }
      if (!newStop.descriptions[target]) {
        newStop.descriptions[target] = response.data.description;
      }
      setStop(newStop);
    } catch {
      setError(new UnexpectedError());
    }
  }

  const form = (
    <div className="row">
      <div className="col-md-6">
        {!Stop && <div className="spinner-border"></div>}
        {variant && Stop && (
          <form autoComplete="off" onSubmit={onSubmit}>
            {error && error.message && <div className="alert alert-danger">{error.message}</div>}
            <fieldset disabled={isLoading}>
              <FormGroup
                name="name"
                label="Name"
                helpText="The name of this Stop as it appears in this Editor"
                onChange={onChange}
                record={Stop}
                error={error}
              />
              {Stop.type === 'STOP' && (
                <>
                  <FormGroup name="link" label="Link" onChange={onChange} record={Stop} error={error} />
                  <FormGroup name="address" type="address" label="Address" onChange={onChange} record={Stop} error={error} />
                </>
              )}
              {Stop.type === 'TRANSITION' && (
                <>
                  <FormGroup name="address" type="address" label="Starting Address" onChange={onChange} record={Stop} error={error} />
                  <FormGroup
                    name="destAddress"
                    type="address"
                    label="Destination Address"
                    onChange={onChange}
                    record={Stop}
                    error={error}
                  />
                </>
              )}
              <VariantTabs variants={Stop.variants} current={variant} setVariant={setVariant} />
              <FormGroup
                name="names"
                label="Display Name"
                helpText="The name of this Stop as it appears to the public"
                onChange={onChange}
                value={Stop.names[variant?.code]}
                error={error}
              />
              <FormGroup
                type="textarea"
                name="descriptions"
                label="Description"
                onChange={onChange}
                value={Stop.descriptions[variant?.code]}
                error={error}
              />
              <div className="mb-3 d-flex justify-content-between">
                <div className="d-flex gap-2">
                  <button className="btn btn-primary" type="submit">
                    Submit
                  </button>
                  <button onClick={onCancelInternal} className="btn btn-secondary" type="button">
                    Cancel
                  </button>
                </div>
                {variant.code !== Stop.variants[0].code && (
                  <button className="btn btn-outline-primary" type="button" onClick={() => onTranslateVariant(variant)}>
                    Translate
                  </button>
                )}
              </div>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
  if (StopIdParam) {
    return (
      <>
        <main className="container">
          <h1 className="mb-3">Edit {Stop ? capitalize(Stop.type) : ''}</h1>
          {form}
        </main>
      </>
    );
  } else {
    return form;
  }
}

StopForm.propTypes = {
  StopId: PropTypes.string,
  onCancel: PropTypes.func,
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
  startingAddress: PropTypes.string,
  type: PropTypes.oneOf(['INTRO', 'STOP', 'TRANSITION']),
  variants: PropTypes.array,
};

export default StopForm;
