import { Navigate, useLocation } from 'react-router-dom';

import { handleRedirects } from './AppRedirectsHandler';

function AppRedirects({ children }) {
  const location = useLocation();
  const result = handleRedirects(location.pathname, (to, state) => {
    if (state) {
      return <Navigate to={to} state={state} replaces />;
    }
    return <Navigate to={to} />;
  });
  return result ? result : children;
}
export default AppRedirects;
