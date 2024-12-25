import { createContext, useContext } from 'react';

export const staticContext = createContext();

export const defaultValue = {
  authContext: {
    user: null,
  },
  env: {
    FEATURE_REGISTRATION: import.meta.env.VITE_FEATURE_REGISTRATION,
    MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    SITE_TITLE: import.meta.env.VITE_SITE_TITLE,
  },
};

export function useStaticContext() {
  return useContext(staticContext);
}
