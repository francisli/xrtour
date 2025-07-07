import { createContext, useContext } from 'react';

export const staticContext = createContext();

export const defaultValue = {
  authContext: {
    user: null,
  },
  env: {
    FEATURE_ASSET_TYPES: import.meta.env.VITE_FEATURE_ASSET_TYPES,
    FEATURE_REGISTRATION: import.meta.env.VITE_FEATURE_REGISTRATION,
    FEATURE_TRANSITIONS: import.meta.env.VITE_FEATURE_TRANSITIONS,
    GOOGLE_WEBFONTS_API_KEY: import.meta.env.VITE_GOOGLE_WEBFONTS_API_KEY,
    MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    SITE_TITLE: import.meta.env.VITE_SITE_TITLE,
  },
};

export function useStaticContext() {
  return useContext(staticContext);
}
