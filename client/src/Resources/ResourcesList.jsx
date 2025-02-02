import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faTableCells } from '@fortawesome/free-solid-svg-icons';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import Pagination from '../Components/Pagination';
import ResourceCard from './ResourceCard';

function ResourcesList({ onNew, onSelect, onEdit, refreshToken = 0, type: initialType = 'IMAGE', types }) {
  const { membership } = useAuthContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') ?? 'list';
  const type = searchParams.get('type') ?? (types ? types[0] : initialType);
  const searchDebounced = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const [search, setSearch] = useState(searchDebounced);
  const [resources, setResources] = useState();
  const [lastPage, setLastPage] = useState(page);

  const timeoutRef = useRef();

  useEffect(() => {
    let isCancelled = false;
    if (membership) {
      setResources(undefined);
      Api.resources.index(membership.TeamId, type, searchDebounced, page).then((response) => {
        if (isCancelled) return;
        setResources(response.data);
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
  }, [membership, type, refreshToken, searchDebounced, page]);

  function onClickType(newType) {
    if (type !== newType) {
      setSearchParams({ q: searchDebounced, view, type: newType });
    }
  }

  function onSearchChange(event) {
    const { value } = event.target;
    setSearch(value);
    // debounce the search value change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setSearchParams({ q: value, view, type });
    }, 300);
  }

  function setView(newView) {
    if (newView !== view) {
      setSearchParams({ q: searchDebounced, view: newView, type });
    }
  }

  return (
    <div className="row">
      <div className="col-md-3">
        <ul className="list-group mb-3">
          {(!types || types.includes('3D_MODEL')) && (
            <button
              type="button"
              onClick={() => onClickType('3D_MODEL')}
              className={classNames('list-group-item list-group-item-action', { active: type === '3D_MODEL' })}>
              3D Model
            </button>
          )}
          {(!types || types.includes('AUDIO')) && (
            <button
              type="button"
              onClick={() => onClickType('AUDIO')}
              className={classNames('list-group-item list-group-item-action', { active: type === 'AUDIO' })}>
              Audio
            </button>
          )}
          {(!types || types.includes('AR_LINK')) && (
            <button
              type="button"
              onClick={() => onClickType('AR_LINK')}
              className={classNames('list-group-item list-group-item-action', { active: type === 'AR_LINK' })}>
              AR Links
            </button>
          )}
          {(!types || types.includes('IMAGE')) && (
            <button
              type="button"
              onClick={() => onClickType('IMAGE')}
              className={classNames('list-group-item list-group-item-action', { active: type === 'IMAGE' })}>
              Images
            </button>
          )}
          {(!types || types.includes('IMAGE_OVERLAY')) && (
            <button
              type="button"
              onClick={() => onClickType('IMAGE_OVERLAY')}
              className={classNames('list-group-item list-group-item-action', { active: type === 'IMAGE_OVERLAY' })}>
              Image Overlays
            </button>
          )}
          {(!types || types.includes('IMAGE_SPHERE')) && (
            <button
              type="button"
              onClick={() => onClickType('IMAGE_SPHERE')}
              className={classNames('list-group-item list-group-item-action', { active: type === 'IMAGE_SPHERE' })}>
              360&deg; Image Spheres
            </button>
          )}
        </ul>
        <div className="mb-3">
          <input onChange={onSearchChange} value={search} type="search" className="form-control" placeholder="Search..." />
        </div>
        <div className="mb-3">
          <button onClick={() => onNew(type)} type="button" className="btn btn-primary">
            New Asset
          </button>
        </div>
      </div>
      <div className="col-md-9">
        <div className="mb-3">
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
        {!resources && <div className="spinner-border"></div>}
        {resources?.length === 0 && <p>No assets yet.</p>}
        {!!resources?.length && (
          <>
            {view === 'card' && (
              <div className="row">
                {resources?.map((r) => (
                  <ResourceCard key={r.id} resource={r} onSelect={onSelect} onEdit={onEdit} />
                ))}
              </div>
            )}
            {view === 'list' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Uploaded At</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{DateTime.fromISO(r.createdAt).toLocaleString(DateTime.DATETIME_SHORT)}</td>
                      <td>
                        {onSelect && (
                          <button onClick={() => onSelect(r)} type="button" className="btn btn-link">
                            Select
                          </button>
                        )}
                        <button onClick={() => onEdit(r)} type="button" className="btn btn-link border-0 p-0">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Pagination page={page} lastPage={lastPage} otherParams={{ view, type, q: searchDebounced }} />
          </>
        )}
      </div>
    </div>
  );
}

ResourcesList.propTypes = {
  onNew: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  refreshToken: PropTypes.number,
  type: PropTypes.string,
  types: PropTypes.array,
};

export default ResourcesList;
