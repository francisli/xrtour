import { createContext, useContext } from 'react';

const staticContext = createContext();

const defaultValue = {};

function useStaticContext() {
  return useContext(staticContext);
}

function StaticContextProvider({ value, children }) {
  return <staticContext.Provider value={value}>{children}</staticContext.Provider>;
}

export { defaultValue, useStaticContext, StaticContextProvider };
