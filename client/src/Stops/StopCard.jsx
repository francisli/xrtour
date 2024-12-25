import PropTypes from 'prop-types';

import './StopCard.scss';

function StopCard({ stop, onSelect }) {
  const sr = stop.Resources.find((sr) => sr.Resource.type === 'IMAGE');
  return (
    <div className="stop-card col-md-4">
      <div className="card">
        <div className="stop-card__img card-img-top" style={{ backgroundImage: `url(${sr?.Resource?.Files?.[0].URL})` }}></div>
        <div className="card-body">
          <h3 className="card-title h6">{stop.names[stop.variants[0].code]}</h3>
          {stop.type === 'TRANSITION' && (
            <>
              <div className="small">
                <b>From:</b> {stop.address}
              </div>
              <p className="small">
                <b>To:</b> {stop.destAddress}
              </p>
            </>
          )}
          {stop.type !== 'TRANSITION' && <p className="small">{stop.address}</p>}
          <button onClick={() => onSelect(stop)} type="button" className="btn btn-sm btn-primary">
            Select
          </button>
        </div>
      </div>
    </div>
  );
}

StopCard.propTypes = {
  stop: PropTypes.shape({
    Resources: PropTypes.arrayOf(
      PropTypes.shape({
        Resource: PropTypes.shape({
          type: PropTypes.string.isRequired,
          Files: PropTypes.arrayOf(
            PropTypes.shape({
              URL: PropTypes.string.isRequired,
            })
          ).isRequired,
        }),
      })
    ).isRequired,
    names: PropTypes.object.isRequired,
    variants: PropTypes.arrayOf(
      PropTypes.shape({
        code: PropTypes.string.isRequired,
      })
    ).isRequired,
    address: PropTypes.string,
    destAddress: PropTypes.string,
    type: PropTypes.string.isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default StopCard;
