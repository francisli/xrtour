import PropTypes from 'prop-types';

import { staticContext } from './StaticContext';

function StaticContextProvider({ value, children }) {
  return <staticContext.Provider value={value}>{children}</staticContext.Provider>;
}

StaticContextProvider.propTypes = {
  value: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

export default StaticContextProvider;
