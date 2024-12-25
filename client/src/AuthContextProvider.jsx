import { useState } from 'react';
import PropTypes from 'prop-types';

import { authContext } from './AuthContext';
import { useStaticContext } from './StaticContext';

function AuthContextValue() {
  const staticContext = useStaticContext();
  const [user, setUser] = useState(staticContext.authContext?.user);
  const [membership, setMembership] = useState(null);
  return {
    user,
    setUser,
    membership,
    setMembership,
  };
}

function AuthContextProvider({ children }) {
  const value = AuthContextValue();
  return <authContext.Provider value={value}>{children}</authContext.Provider>;
}

AuthContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContextProvider;
