import { matchPath } from 'react-router-dom';

export const REDIRECTS = [];

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
