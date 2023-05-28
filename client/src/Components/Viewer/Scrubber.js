import classNames from 'classnames';

import TimeCode from '../TimeCode';

import './Scrubber.scss';

function Scrubber({ className, position, duration }) {
  return (
    <div className={classNames('scrubber', className)}>
      <div className="scrubber__position">
        <TimeCode seconds={position} />
      </div>
      <div className="scrubber__bar">
        <div className="scrubber__progress" style={{ width: `${Math.round((100 * position) / duration)}%` }}></div>
      </div>
      <div className="scrubber__duration">
        <TimeCode seconds={duration} />
      </div>
    </div>
  );
}

export default Scrubber;
