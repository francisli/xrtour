import { Navigate, matchPath, useLocation } from 'react-router-dom';

export const REDIRECTS = [
  ['/admin', '/admin/users'],
  ['/passwords', '/passwords/forgot'],
];

export function handleRedirects(pathname, callback) {
  for (const redirect of REDIRECTS) {
    let [src, dest] = redirect;
    const match = matchPath(src, pathname);
    if (match) {
      if (match.params) {
        for (const key of Object.keys(match.params)) {
          dest = dest.replace(`:${key}`, match.params[key]);
        }
      }
      if (dest !== src) {
        return callback(dest);
      }
      break;
    }
  }
  return false;
}

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
