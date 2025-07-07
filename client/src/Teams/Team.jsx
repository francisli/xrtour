import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { useAuthContext } from '../AuthContext';

function Team() {
  const { user, membership, setMembership } = useAuthContext();
  const { TeamId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const newMembership = user.Memberships.find((m) => m.TeamId === TeamId);
      if (newMembership) {
        setMembership(newMembership);
      } else {
        navigate('/');
      }
    }
  }, [TeamId, user, setMembership, navigate]);

  const font = membership?.Team?.font;

  return (
    <>
      <Helmet>
        {font && (
          <>
            <link
              href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(
                font.family
              )}:wght@400;600;700&subset=${font.subsets.join(',')}&display=swap`}
              rel="stylesheet"
            />
          </>
        )}
      </Helmet>
      <Outlet />
    </>
  );
}

export default Team;
