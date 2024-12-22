import { Routes, Route } from 'react-router-dom';
import TourPreview from './TourPreview';

function TourPreviewRoutes() {
  return (
    <Routes>
      <Route path="stops/:TourStopId" element={<TourPreview />} />
      <Route path="" element={<TourPreview />} />
    </Routes>
  );
}
export default TourPreviewRoutes;
