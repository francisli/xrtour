import { createContext, useContext } from 'react';

const staticContext = createContext();

const defaultValue = {
  authContext: {
    user: null,
  },
  env: {
    FEATURE_REGISTRATION: process.env.REACT_APP_FEATURE_REGISTRATION,
    MAPBOX_ACCESS_TOKEN: process.env.REACT_APP_MAPBOX_ACCESS_TOKEN,
    SITE_TITLE: process.env.REACT_APP_SITE_TITLE,
  },
};

function useStaticContext() {
  return useContext(staticContext);
}

function StaticContextProvider({ value, children }) {
  return <staticContext.Provider value={value}>{children}</staticContext.Provider>;
}

export { defaultValue, useStaticContext, StaticContextProvider };
