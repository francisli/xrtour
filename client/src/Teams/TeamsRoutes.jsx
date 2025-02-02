import { Route, Routes } from 'react-router-dom';

import Team from './Team';
import TeamAssetsList from './TeamAssetsList';
import TeamForm from './TeamForm';
import TeamsList from './TeamsList';
import ToursRoutes from '../Tours/ToursRoutes';

function TeamsRoutes() {
  return (
    <Routes>
      <Route path="new" element={<TeamForm />} />
      <Route path=":TeamId" element={<Team />}>
        <Route path="assets" element={<TeamAssetsList />} />
        <Route path="manage" element={<TeamForm />} />
        <Route path="tours/*" element={<ToursRoutes />} />
      </Route>
      <Route path="" element={<TeamsList />} />
    </Routes>
  );
}

export default TeamsRoutes;
