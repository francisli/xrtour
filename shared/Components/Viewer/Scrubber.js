import classNames from 'classnames';

import TimeCode from '../TimeCode';

import './Scrubber.scss';

function Scrubber({ className, position, duration, from, to, onSeek }) {
  function onClick(event) {
    const rect = event.target.getBoundingClientRect();
    const dx = event.clientX - rect.left;
    onSeek?.((duration * dx) / rect.width);
  }

  return (
    <div className={classNames('scrubber', className)}>
      <div className="scrubber__position">{from ? from : <TimeCode seconds={position} />}</div>
      <div onClick={onClick} className="scrubber__bar">
        <div className="scrubber__progress" style={{ width: `${Math.ceil((100 * position) / duration)}%` }}></div>
      </div>
      <div className="scrubber__duration">{to ? to : <TimeCode seconds={duration} />}</div>
    </div>
  );
}

export default Scrubber;
