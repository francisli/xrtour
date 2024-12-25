import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { defaultValue } from './StaticContext.js';
import StaticContextProvider from './StaticContextProvider.jsx';

const container = document.getElementById('root');
const staticContext = { ...defaultValue, ...window.STATIC_CONTEXT };
const app = (
  <StaticContextProvider value={staticContext}>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StaticContextProvider>
);
if (import.meta.env.DEV) {
  createRoot(container).render(<StrictMode>{app}</StrictMode>);
} else {
  hydrateRoot(container, app);
}
