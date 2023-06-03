import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusCodes } from 'http-status-codes';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import FormGroup from '../Components/FormGroup';
import UnexpectedError from '../UnexpectedError';
import ValidationError from '../ValidationError';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

function TeamForm() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthContext();
  const { TeamId } = useParams();

  const isEditing = !!TeamId;
  const isFirstTeam = !user?.Memberships?.length;

  const [team, setTeam] = useState({
    name: isFirstTeam ? `${user.firstName}'s Personal Team` : '',
    link: isFirstTeam ? `${user.firstName}${user.lastName}`.toLocaleLowerCase() : '',
  });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState();

  useEffect(() => {
    let isCancelled = false;
    if (TeamId) {
      Api.teams.get(TeamId).then((response) => {
        if (isCancelled) return;
        setTeam(response.data);
      });
    }
    return () => (isCancelled = true);
  }, [TeamId]);

  function onChange(event) {
    const newTeam = { ...team };
    newTeam[event.target.name] = event.target.value;
    setTeam(newTeam);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let response;
      if (team.id) {
        response = await Api.teams.update(team.id, team);
      } else {
        response = await Api.teams.create(team);
      }
      const Team = { ...response.data };
      const { Memberships } = Team;
      const [Membership] = Memberships;
      delete Team.Memberships;
      Membership.Team = Team;
      const index = user.Memberships.findIndex((m) => m.id === Membership.id);
      if (index >= 0) {
        user.Memberships[index] = Membership;
      } else {
        user.Memberships.push(Membership);
      }
      user.Memberships.sort((m1, m2) => m1.Team?.name?.localeCompare(m2.Team?.name));
      setUser({ ...user });
      navigate(`/teams/${Team.id}`);
    } catch (error) {
      if (error.response?.status === StatusCodes.UNPROCESSABLE_ENTITY) {
        setError(new ValidationError(error.response.data));
      } else {
        setError(new UnexpectedError());
      }
    } finally {
      setLoading(false);
    }
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
        {TeamId && (
          <div className="col col-sm-10 col-md-4 col-lg-6 col-xl-5">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title">Manage Members</h2>
              </div>
              <ul className="list-group list-group-flush">
                {team?.Memberships?.map((m) => (
                  <li key={m.id} className="list-group-item d-flex align-items-center justify-content-between">
                    <span>
                      {m.User?.firstName} {m.User?.lastName} &lt;{m.User?.email}&gt;
                    </span>
                    <span className="d-flex">
                      <select className="form-select me-2" value={m.role} readOnly>
                        <option value="OWNER">Owner</option>
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button type="button" className="btn btn-icon btn-sm btn-outline-danger flex-shrink-0">
                        <FontAwesomeIcon icon={faTrashCan} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
export default TeamForm;
