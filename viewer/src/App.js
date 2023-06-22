import { Routes, Route } from 'react-router-dom';

import './App.scss';

import AppRedirects from './AppRedirects';
import Home from './Home';

function App() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <AppRedirects>
            <Home />
          </AppRedirects>
        }
      />
    </Routes>
  );
}

export default App;
