import { Routes, Route } from 'react-router-dom';

import 'mapbox-gl/dist/mapbox-gl.css';
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
            <Routes>
              <Route path=":TourLink/stops/:TourStopId" element={<Home />} />
              <Route path=":TourLink" element={<Home />} />
            </Routes>
          </AppRedirects>
        }
      />
    </Routes>
  );
}

export default App;
