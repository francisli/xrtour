import { useEffect, useState } from 'react';

import Scrubber from './Scrubber';
import './StopViewer.scss';

function StopViewer({ position, stop, variant }) {
  const [duration, setDuration] = useState(0);
  const [imageURL, setImageURL] = useState();

  useEffect(() => {
    let isCancelled = false;
    let newImageURL;
    if (stop.StopResources) {
      let newDuration = 0;
      for (const sr of stop.StopResources) {
        if (isCancelled) return;
        if (sr.end) {
          newDuration = Math.max(newDuration, sr.end);
        } else if (sr.start) {
          newDuration = Math.max(newDuration, sr.start);
        }
        if (sr.Resource.type === 'IMAGE') {
          if (sr.start <= position && (sr.end ?? Number.MAX_SAFE_INTEGER) > position) {
            newImageURL = sr.Resource.Files.find((f) => f.variant === variant.code)?.URL;
          }
        }
      }
      setDuration(newDuration);
      setImageURL(newImageURL);
    }
    return () => (isCancelled = true);
  }, [stop, variant, position]);

  return (
    <div className="stop-viewer">
      <div className="stop-viewer__image" style={{ backgroundImage: imageURL ? `url(${imageURL})` : 'none' }}></div>
      <div className="stop-viewer__controls">
        <Scrubber position={position} duration={duration} className="stop-viewer__scrubber" />
      </div>
    </div>
  );
}
export default StopViewer;
