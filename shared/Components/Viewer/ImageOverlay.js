import { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import Scrubber from './Scrubber';

import './ImageOverlay.scss';

function ImageOverlay({ onClose, resource, variant }) {
  const camera = useRef(null);
  const [opacity, setOpacity] = useState(0.5);

  const imageURL = resource.Files.find((f) => f.variant === variant.code)?.URL;

  return (
    <div className="image-overlay">
      <div className="image-overlay__container">
        <Camera ref={camera} facingMode="environment" />
      </div>
      <div className="image-overlay__image" style={{ backgroundImage: `url(${imageURL})`, opacity }}></div>
      <Scrubber className="image-overlay__scrubber" position={opacity} duration={1} from="Then" to="Now" onSeek={setOpacity} />
      <div className="image-overlay__close">
        <button onClick={() => onClose()} className="btn btn-lg btn-primary btn-round">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
}
export default ImageOverlay;
