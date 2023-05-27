import { useState } from 'react';

import './StopViewer.scss';

function StopViewer({ stop, variant }) {
  const [position, setPosition] = useState(0);

  let duration = 0;
  let currentImageURL;
  if (stop.StopResources) {
    for (const sr of stop.StopResources) {
      if (sr.end) {
        duration = Math.max(duration, sr.end);
      }
      if (sr.Resource.type === 'IMAGE') {
        if (sr.start <= position && (sr.end ?? Number.MAX_SAFE_INTEGER) > position) {
          currentImageURL = sr.Resource.Files.find((f) => f.variant === variant.code)?.URL;
        }
      }
    }
  }
  console.log(stop.StopResources, duration, currentImageURL);

  return (
    <div className="stop-viewer">
      <div className="stop-viewer__image" style={{ backgroundImage: currentImageURL ? `url(${currentImageURL})` : 'none' }}></div>
    </div>
  );
}
export default StopViewer;
