import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import './Toc.scss';

function Toc({ isOpen, onClose, onSelect, tourStops, variant }) {
  return (
    <div className={classNames('toc', { 'toc--open': isOpen })}>
      <div className="toc__close">
        <button onClick={() => onClose()} className="btn btn-lg btn-outline-primary">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <div className="toc__header h2 text-center">Table of Contents</div>
      <div className="toc__list">
        {tourStops?.map((ts, i) => (
          <button onClick={() => onSelect?.(ts)} className="toc__item list-group-item">
            {i + 1}. {ts.Stop?.names?.[variant?.code]}
          </button>
        ))}
      </div>
    </div>
  );
}
export default Toc;
