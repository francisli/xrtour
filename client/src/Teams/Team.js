import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuthContext } from '../AuthContext';
import FormGroup from '../Components/FormGroup';

function Team() {
  const { user } = useAuthContext();
  const { teamId } = useParams();

  const isEditing = !!teamId;
  const isFirstTeam = !user?.Memberships?.length;

  const [team, setTeam] = useState({
    name: isFirstTeam ? `${user.firstName}'s Personal Team` : '',
    link: '',
  });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState();

  function onChange(event) {
    const newTeam = { ...team };
    newTeam[event.target.name] = event.target.value;
    setTeam(newTeam);
  }

  function onSubmit(event) {
    event.preventDefault();
  }

  return (
    <main className="container">
      <div className="row justify-content-center">
        <div className="col col-sm-10 col-md-8 col-lg-6 col-xl-4">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">
                {isEditing && 'Edit Team'}
                {!isEditing && !isFirstTeam && 'New Team'}
                {!isEditing && isFirstTeam && 'Set up your Personal Team'}
              </h2>
              <form onSubmit={onSubmit}>
                {error && error.message && <div className="alert alert-danger">{error.message}</div>}
                <fieldset disabled={isLoading}>
                  <FormGroup name="name" label="Name" onChange={onChange} record={team} error={error} />
                  <FormGroup
                    name="link"
                    label="Link name"
                    helpText="Letters, numbers, and hypen only, to be used in URLs."
                    onChange={onChange}
                    record={team}
                    error={error}
                  />
                  <div className="mb-3 d-grid">
                    <button className="btn btn-primary" type="submit">
                      Submit
                    </button>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
export default Team;
