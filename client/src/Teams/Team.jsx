import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuthContext } from '../AuthContext';

function Team() {
  const { user, setMembership } = useAuthContext();
  const { TeamId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const membership = user.Memberships.find((m) => m.TeamId === TeamId);
      if (membership) {
        setMembership(membership);
      } else {
        navigate('/');
      }
    }
  }, [TeamId, user, setMembership, navigate]);

  return <Outlet />;
}

export default Team;
