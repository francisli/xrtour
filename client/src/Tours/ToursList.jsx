import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faTableCells } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { DateTime } from 'luxon';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import Pagination from '../Components/Pagination';
import { useStaticContext } from '../StaticContext';

import TourCard from './TourCard';

function ToursList() {
  const staticContext = useStaticContext();
  const { membership } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = searchParams.get('view') ?? 'list';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const [lastPage, setLastPage] = useState(page);
  const [tours, setTours] = useState();

  useEffect(() => {
    if (!membership) return;
    let isCancelled = false;
    Api.tours.index(membership.TeamId).then((response) => {
      if (isCancelled) return;
      setTours(response.data);
      const linkHeader = Api.parseLinkHeader(response);
      let newLastPage = page;
      if (linkHeader?.last) {
        const match = linkHeader.last.match(/page=(\d+)/);
        newLastPage = parseInt(match[1], 10);
      } else if (linkHeader?.next) {
        newLastPage = page + 1;
      }
      setLastPage(newLastPage);
    });
    return () => (isCancelled = true);
  }, [membership, page]);

  function setView(newView) {
    if (newView !== view) {
      setSearchParams({ view: newView });
    }
  }

  return (
    <>
      <Helmet>
        <title>
          {membership?.Team?.name ?? ''} - Tours - {staticContext?.env?.SITE_TITLE}
        </title>
      </Helmet>
      <main className="container">
        <h1 className="mb-3">{membership?.Team?.name} - Tours</h1>
        <div className="mb-3 text-end">
          <span className="me-2">View:</span>
          <div className="btn-group" role="group" aria-label="View options button group">
            <button
              type="button"
              className={classNames('btn btn-outline-secondary', { active: view === 'list' })}
              onClick={() => setView('list')}>
              <FontAwesomeIcon icon={faList} />
            </button>
            <button
              type="button"
              className={classNames('btn btn-outline-secondary', { active: view === 'card' })}
              onClick={() => setView('card')}>
              <FontAwesomeIcon icon={faTableCells} />
            </button>
          </div>
        </div>
        {!tours && <div className="spinner-border"></div>}
        {tours && (
          <>
            {view === 'list' && (
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tours.map((tour) => (
                    <tr key={tour.id} onClick={() => navigate(tour.id)}>
                      <td>{tour.names[tour.variants[0].code]}</td>
                      <td>{DateTime.fromISO(tour.createdAt).toLocaleString(DateTime.DATETIME_SHORT)}</td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {view === 'card' && (
              <div className="row">
                {membership?.role !== 'VIEWER' && <TourCard href="new" />}
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} href={tour.id} />
                ))}
                {membership?.role === 'VIEWER' && tours.length === 0 && <div>No tours to view yet.</div>}
              </div>
            )}
            <Pagination page={page} lastPage={lastPage} otherParams={{ view }} />
          </>
        )}
      </main>
    </>
  );
}

export default ToursList;
