import PropTypes from 'prop-types';

import { staticContext } from './StaticContext';

function StaticContextProvider({ value, children }) {
  return <staticContext.Provider value={value}>{children}</staticContext.Provider>;
}

StaticContextProvider.propTypes = {
  value: PropTypes.object,
  children: PropTypes.node,
};

export default StaticContextProvider;
