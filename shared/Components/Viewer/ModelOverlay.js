import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import './ModelOverlay.scss';

import('@google/model-viewer').then();

function ModelOverlay({ onClose, resource, variant }) {
  const modelURL = resource.Files.find((f) => f.variant === variant.code)?.URL;

  return (
    <div className="model-overlay">
      <div className="model-overlay__container">
        <model-viewer class="model-overlay__viewer" src={modelURL} ar auto-rotate camera-controls></model-viewer>
      </div>
      <div className="model-overlay__close">
        <button onClick={() => onClose()} className="btn btn-lg btn-primary btn-round">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
}
export default ModelOverlay;
