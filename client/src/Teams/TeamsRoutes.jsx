import { Route, Routes } from 'react-router-dom';

import AssetsList from './AssetsList';
import TeamForm from './TeamForm';
import TeamsList from './TeamsList';
import ToursRoutes from '../Tours/ToursRoutes';

function TeamsRoutes() {
  return (
    <Routes>
      <Route path="new" element={<TeamForm />} />
      <Route path=":TeamId/assets" element={<AssetsList />} />
      <Route path=":TeamId/manage" element={<TeamForm />} />
      <Route path=":TeamId/tours/*" element={<ToursRoutes />} />
      <Route path="" element={<TeamsList />} />
    </Routes>
  );
}

export default TeamsRoutes;
