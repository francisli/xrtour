import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import './Map.scss';

function Map({ isOpen, onClose }) {
  return (
    <div className={classNames('map', { 'map--open': isOpen })}>
      <div className="map__close">
        <button onClick={() => onClose()} className="btn btn-lg btn-outline-primary">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
}
export default Map;
