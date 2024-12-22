import { createContext, useContext } from 'react';

const staticContext = createContext();

const defaultValue = {
  authContext: {
    user: null,
  },
  env: {
    FEATURE_REGISTRATION: import.meta.env.VITE_FEATURE_REGISTRATION,
    MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    SITE_TITLE: import.meta.env.VITE_SITE_TITLE,
  },
};

function useStaticContext() {
  return useContext(staticContext);
}

function StaticContextProvider({ value, children }) {
  return <staticContext.Provider value={value}>{children}</staticContext.Provider>;
}

export { defaultValue, useStaticContext, StaticContextProvider };
