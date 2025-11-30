import { useState } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import './Toc.scss';

function Toc({ isOpen, onClose, onSelect, tour, tourStops, variant, onSelectVariant }) {
  const [isShowingVariants, setIsShowingVariants] = useState(false);

  function onSelectVariantInternal(v) {
    onSelectVariant?.(v);
    setIsShowingVariants(false);
  }

  return (
    <div className={classNames('toc', { 'toc--open': isOpen })}>
      <div className="toc__close">
        <button onClick={() => onClose()} className="btn btn-lg btn-custom-primary btn-round">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <div className="toc__header h2 text-center">{tour?.names[variant?.code] || tour?.names[tour.variants[0].code]}</div>
      <div className="toc__list">
        {tour?.IntroStop && (
          <button onClick={() => onSelect?.()} className="toc__item list-group-item">
            0. {tour?.IntroStop?.names?.[variant?.code] || tour?.IntroStop?.names?.[tour.variants[0].code]}
          </button>
        )}
        {tourStops?.map((ts, i) => (
          <button key={ts.id} onClick={() => onSelect?.(ts)} className="toc__item list-group-item">
            {i + 1}. {ts.Stop?.names?.[variant?.code] || ts.Stop?.names?.[tour.variants[0].code]}
          </button>
        ))}
      </div>
      <div className="toc__variants">
        <div className="dropdown">
          <button
            className="btn btn-outline-secondary dropdown-toggle"
            type="button"
            onClick={() => setIsShowingVariants(!isShowingVariants)}>
            {variant?.displayName}
          </button>
          <ul className={classNames('dropdown-menu', { show: isShowingVariants })}>
            {tour?.variants?.map((v) => (
              <li key={v.code}>
                <button className="dropdown-item" onClick={() => onSelectVariantInternal(v)}>
                  {v.displayName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
export default Toc;
