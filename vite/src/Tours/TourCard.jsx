import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import './TourCard.scss';

function TourCard({ tour, href }) {
  const isNew = href === 'new';
  let title;
  let imageURL;
  if (tour) {
    title = tour.names[tour.variants[0].code];
    imageURL = tour.CoverResource?.Files[0].URL;
  }
  return (
    <div className={classNames('tour-card col-6 col-md-4 col-lg-3', { 'tour-card--new': isNew })}>
      <Link to={href} className="card text-decoration-none">
        <div className="tour-card__img card-img-top" style={{ backgroundImage: imageURL ? `url(${imageURL})` : 'none' }}>
          {isNew && (
            <div className="tour-card__overlay">
              <FontAwesomeIcon icon={faPlus} />
              <h3>New Tour</h3>
            </div>
          )}
        </div>
        {!isNew && (
          <div className="card-body">
            <h3 className="card-title text-center h6 mb-0">{title}</h3>
          </div>
        )}
      </Link>
    </div>
  );
}
export default TourCard;
