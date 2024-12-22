import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { defaultValue, StaticContextProvider } from './StaticContext';

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
if (process.env.NODE_ENV === 'development') {
  createRoot(container).render(<StrictMode>{app}</StrictMode>);
} else {
  hydrateRoot(container, app);
}
