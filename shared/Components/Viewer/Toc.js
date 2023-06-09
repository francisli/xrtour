import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import './Toc.scss';

function Toc({ isOpen, onClose, onSelect, tour, tourStops, variant }) {
  return (
    <div className={classNames('toc', { 'toc--open': isOpen })}>
      <div className="toc__close">
        <button onClick={() => onClose()} className="btn btn-lg btn-primary btn-round">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <div className="toc__header h2 text-center">{tour?.names[variant?.code]}</div>
      <div className="toc__list">
        {tour?.IntroStop && (
          <button onClick={() => onSelect?.()} className="toc__item list-group-item">
            0. {tour?.IntroStop?.names?.[variant?.code]}
          </button>
        )}
        {tourStops?.map((ts, i) => (
          <button key={ts.id} onClick={() => onSelect?.(ts)} className="toc__item list-group-item">
            {i + 1}. {ts.Stop?.names?.[variant?.code]}
          </button>
        ))}
      </div>
    </div>
  );
}
export default Toc;
