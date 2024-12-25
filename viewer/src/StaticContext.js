import { createContext, useContext } from 'react';

export const staticContext = createContext();

export const defaultValue = {
  env: {
    MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
  },
};

export function useStaticContext() {
  return useContext(staticContext);
}
