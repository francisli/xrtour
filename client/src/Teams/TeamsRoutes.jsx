import { Route, Routes } from 'react-router-dom';

import Stop from '../Stops/Stop';
import StopForm from '../Stops/StopForm';
import ToursRoutes from '../Tours/ToursRoutes';

import Team from './Team';
import TeamAssetsList from './TeamAssetsList';
import TeamForm from './TeamForm';
import TeamStopsList from './TeamStopsList';
import TeamsList from './TeamsList';

function TeamsRoutes() {
  return (
    <Routes>
      <Route path="new" element={<TeamForm />} />
      <Route path=":TeamId" element={<Team />}>
        <Route path="assets" element={<TeamAssetsList />} />
        <Route path="manage" element={<TeamForm />} />
        <Route path="stops">
          <Route path=":StopId/edit" element={<StopForm />} />
          <Route path=":StopId" element={<Stop />} />
          <Route path="" element={<TeamStopsList />} />
        </Route>
        <Route path="tours/*" element={<ToursRoutes />} />
      </Route>
      <Route path="" element={<TeamsList />} />
    </Routes>
  );
}

export default TeamsRoutes;
