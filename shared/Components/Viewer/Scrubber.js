import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import TimeCode from '../TimeCode';

import './Scrubber.scss';

function Scrubber({ className, position, duration, from, to, scrub, onSeek }) {
  const barRef = useRef();
  const [isDragging, setDragging] = useState(false);
  const [thumbLeft, setThumbLeft] = useState(Math.ceil((100 * position) / duration));

  useEffect(() => {
    if (!isDragging) {
      setThumbLeft(Math.ceil((100 * position) / duration));
    }
  }, [isDragging, position]);

  function onClick(event) {
    const rect = event.target.getBoundingClientRect();
    const dx = event.clientX - rect.left;
    onSeek?.((duration * dx) / rect.width);
  }

  function onDragThumb(event) {
    if (event.buttons === 1) {
      if (!isDragging) {
        setDragging(true);
        barRef.current?.setPointerCapture(event.pointerId);
      }
      const rect = event.target.getBoundingClientRect();
      const dx = event.clientX - rect.left;
      setThumbLeft(Math.max(0, Math.min(100, Math.ceil((100 * dx) / rect.width))));
      if (scrub) {
        onSeek?.(Math.max(0, Math.min(duration, (duration * dx) / rect.width)));
      }
    }
  }

  function onDragEndThumb(event) {
    if (isDragging) {
      setDragging(false);
      barRef.current?.releasePointerCapture(event.pointerId);
      const rect = event.target.getBoundingClientRect();
      const dx = event.clientX - rect.left;
      onSeek?.(Math.max(0, Math.min(duration, (duration * dx) / rect.width)));
    }
  }

  return (
    <div className={classNames('scrubber', className)}>
      <div className="scrubber__position">{from ? from : <TimeCode seconds={position} />}</div>
      <div ref={barRef} onClick={onClick} onPointerMove={onDragThumb} onPointerUp={onDragEndThumb} className="scrubber__bar">
        <div className="scrubber__progress" style={{ width: `${Math.ceil((100 * position) / duration)}%` }}></div>
        <div className="scrubber__thumb" style={{ left: `${thumbLeft}%` }}></div>
      </div>
      <div className="scrubber__duration">{to ? to : <TimeCode seconds={duration} />}</div>
    </div>
  );
}

export default Scrubber;
