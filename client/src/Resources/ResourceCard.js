import AudioPlayer from '../Components/AudioPlayer';
import './ResourceCard.scss';

function ResourceCard({ resource, onSelect, onEdit }) {
  return (
    <div className="resource-card col-md-4">
      <div className="card">
        {resource.type === 'AUDIO' && (
          <div className="resource-card__audio card-img-top">
            <AudioPlayer src={resource.Files[0].URL} />
          </div>
        )}
        {resource.type === 'IMAGE' && (
          <div className="resource-card__image card-img-top" style={{ backgroundImage: `url(${resource.Files[0].URL})` }}></div>
        )}
        <div className="card-body">
          <h3 className="card-title h6">{resource.name}</h3>
          <div>
            <button onClick={() => onSelect(resource)} type="button" className="btn btn-sm btn-primary">
              Select
            </button>
            &nbsp;
            <button onClick={() => onEdit(resource)} type="button" className="btn btn-sm btn-secondary">
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ResourceCard;
