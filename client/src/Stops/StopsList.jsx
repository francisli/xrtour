import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faPlus, faTableCells } from '@fortawesome/free-solid-svg-icons';
import { capitalize, pluralize } from 'inflection';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { DateTime } from 'luxon';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import Pagination from '../Components/Pagination';
import StopCard from './StopCard';

function StopsList({ onNewStop, onSelect, onEdit, type: initialType = 'STOP', types, refreshToken = 0 }) {
  const { membership } = useAuthContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') ?? (types ? types[0] : initialType);
  const show = searchParams.get('show') ?? 'active';
  const view = searchParams.get('view') ?? 'list';
  const searchDebounced = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const [search, setSearch] = useState(searchDebounced);
  const [stops, setStops] = useState();
  const [lastPage, setLastPage] = useState(page);

  const timeoutRef = useRef();

  useEffect(() => {
    let isCancelled = false;
    if (membership) {
      setStops(undefined);
      Api.stops.index(membership.TeamId, type, show, searchDebounced, page).then((response) => {
        if (isCancelled) return;
        setStops(response.data);
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
    }
    return () => (isCancelled = true);
  }, [membership, type, show, searchDebounced, page, refreshToken]);

  function onSearchChange(event) {
    const { value } = event.target;
    setSearch(value);
    // debounce the search value change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setSearchParams({ type, show, view, q: value });
    }, 300);
  }

  function onClickType(newType) {
    if (type !== newType) {
      setSearchParams({ type: newType, show, view, q: searchDebounced });
    }
  }

  function onChangeShow(newShow) {
    if (newShow !== show) {
      setSearchParams({ type, show: newShow, view, q: searchDebounced });
    }
  }

  function setView(newView) {
    if (newView !== view) {
      setSearchParams({ type, show, view: newView, q: searchDebounced, page });
    }
  }

  return (
    <div className="row">
      <div className="col-md-3">
        <ul className="list-group mb-3">
          {(!types || types.includes('INTRO')) && (
            <button
              type="button"
              onClick={() => onClickType('INTRO')}
              className={classNames('list-group-item list-group-item-action', { active: type === 'INTRO' })}>
              Intros
            </button>
          )}
          {(!types || types.includes('STOP')) && (
            <button
              type="button"
              onClick={() => onClickType('STOP')}
              className={classNames('list-group-item list-group-item-action', { active: type === 'STOP' })}>
              Stops
            </button>
          )}
          {(!types || types.includes('TRANSITION')) && (
            <button
              type="button"
              onClick={() => onClickType('TRANSITION')}
              className={classNames('list-group-item list-group-item-action', { active: type === 'TRANSITION' })}>
              Transitions
            </button>
          )}
        </ul>
      </div>
      <div className="col-md-9">
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            {membership?.role !== 'VIEWER' && (
              <button onClick={() => onNewStop(type)} type="button" className="btn btn-primary flex-shrink-0 me-3">
                <FontAwesomeIcon icon={faPlus} />
                &nbsp;New&nbsp;{capitalize(type)}
              </button>
            )}
            <input onChange={onSearchChange} value={search} type="search" className="form-control" placeholder="Search..." />
          </div>
          <div className="d-flex align-items-center">
            <span className="me-2">Show:</span>
            <select className="form-select me-3" value={show} onChange={(event) => onChangeShow(event.target.value)}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
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
        </div>
        {!stops && <div className="spinner-border"></div>}
        {stops?.length === 0 && <p>No {capitalize(pluralize(type))}.</p>}
        {!!stops?.length && (
          <>
            {view === 'list' && (
              <table className="table table-striped table-hover" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th className="w-50">Name</th>
                    <th className="w-25"></th>
                    <th className="w-25">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {stops?.map((s) => (
                    <tr key={s.id}>
                      <td className="w-50" onClick={() => onEdit?.(s)}>
                        {s.names[s.variants[0].code]}
                        <br />
                        <div className="text-nowrap text-truncate">
                          <small>
                            {s.type === 'TRANSITION' && <b>Fr:&nbsp;</b>}
                            {s.address}
                          </small>
                        </div>
                        {s.type === 'TRANSITION' && (
                          <>
                            <div className="text-nowrap text-truncate">
                              <small>
                                <b>To:&nbsp;</b>
                                {s.destAddress}
                              </small>
                            </div>
                          </>
                        )}
                      </td>
                      <td className="w-25" onClick={onSelect ? undefined : () => onEdit?.(s)}>
                        {onSelect && (
                          <button onClick={() => onSelect(s)} type="button" className="btn btn-link">
                            Select
                          </button>
                        )}
                      </td>
                      <td className="w-25" onClick={() => onEdit?.(s)}>
                        {DateTime.fromISO(s.createdAt).toLocaleString(DateTime.DATETIME_SHORT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {view === 'card' && (
              <div className="row mb-3">
                {stops?.map((s) => (
                  <StopCard key={s.id} stop={s} onSelect={onSelect} />
                ))}
              </div>
            )}
          </>
        )}
        <Pagination page={page} lastPage={lastPage} otherParams={{ view, type, q: searchDebounced }} />
      </div>
    </div>
  );
}

StopsList.propTypes = {
  onNewStop: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  type: PropTypes.string.isRequired,
  types: PropTypes.arrayOf(PropTypes.string),
  refreshToken: PropTypes.number,
};

export default StopsList;
