import PropTypes from 'prop-types';

import AudioPlayer from '../Components/AudioPlayer';

import './ResourceCard.scss';

function ResourceCard({ resource, onSelect, onEdit }) {
  return (
    <div className="resource-card col-md-4 mb-3">
      <div className="card">
        {resource.type === '3D_MODEL' && (
          <div className="card-img-top">
            <model-viewer class="resource-card__3d-model" src={resource.Files[0].URL} />
          </div>
        )}
        {resource.type === 'AUDIO' && (
          <div className="resource-card__audio card-img-top">
            <AudioPlayer src={resource.Files[0].URL} />
          </div>
        )}
        {resource.type?.startsWith('IMAGE') && (
          <div className="resource-card__image card-img-top" style={{ backgroundImage: `url(${resource.Files[0].URL})` }}></div>
        )}
        <div className="card-body">
          <h3 className="card-title h6">{resource.name}</h3>
          {resource.type === 'AR_LINK' && (
            <p>
              <a target="_blank" rel="noreferrer" href={resource.Files[0].URL}>
                {resource.Files[0].URL}
              </a>
            </p>
          )}
          <div className="d-flex justify-content-between">
            {onSelect && (
              <button onClick={() => onSelect(resource)} type="button" className="btn btn-sm btn-primary">
                Select
              </button>
            )}
            <button onClick={() => onEdit(resource)} type="button" className="btn btn-sm btn-outline-secondary">
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ResourceCard.propTypes = {
  resource: PropTypes.shape({
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    Files: PropTypes.arrayOf(
      PropTypes.shape({
        URL: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default ResourceCard;
