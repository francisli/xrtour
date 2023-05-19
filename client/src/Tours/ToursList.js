import { useEffect, useState } from 'react';
import { useAuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

import Api from '../Api';

import TourCard from './TourCard';

function ToursList() {
  const { user, membership, setMembership } = useAuthContext();
  const navigate = useNavigate();

  const [tours, setTours] = useState();

  useEffect(() => {
    if (user?.Memberships?.length === 0) {
      navigate('/teams/new');
    } else if (!membership) {
      setMembership(user?.Memberships?.[0]);
    }
  }, [user, membership, setMembership, navigate]);

  useEffect(() => {
    if (!membership) return;
    let isCancelled = false;
    Api.tours.index(membership.TeamId).then((response) => {
      if (isCancelled) return;
      setTours(response.data);
    });
    return () => (isCancelled = true);
  }, [membership]);

  return (
    <main className="container">
      <h1 className="mb-5">{membership?.Team?.name}</h1>
      {!tours && <div className="spinner-border"></div>}
      {tours && (
        <div className="row">
          {tours.map((tour) => (
            <TourCard key={tour.id} title={tour.names[tour.variants[0].code]} href={tour.id} />
          ))}
          <TourCard title="New Tour" href="new" />
        </div>
      )}
    </main>
  );
}
export default ToursList;
