import classNames from 'classnames';
import PropTypes from 'prop-types';

function Spinner({ className, size }) {
  return <div className={classNames('spinner-border', className, { 'spinner-border-sm': size === 'sm' })}></div>;
}

Spinner.propTypes = {
  className: PropTypes.string,
  size: PropTypes.string,
};

export default Spinner;
