import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import Api from '../Api';
import { useAuthContext } from '../AuthContext';
import ResourceCard from './ResourceCard';

function ResourcesList({ onNew, onSelect, onEdit, type: initialType = 'IMAGE', types }) {
  const { membership } = useAuthContext();

  const [type, setType] = useState(types ? types[0] : initialType);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState(search);
  const [resources, setResources] = useState();

  const timeoutRef = useRef();

  useEffect(() => {
    let isCancelled = false;
    if (membership) {
      setResources(undefined);
      Api.resources.index(membership.TeamId, type, searchDebounced).then((response) => {
        if (isCancelled) return;
        setResources(response.data);
      });
    }
    return () => (isCancelled = true);
  }, [membership, type, searchDebounced]);

  function onClickType(newType) {
    if (type !== newType) {
      setType(newType);
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
      setSearchDebounced(value);
    }, 300);
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
        {!resources && <div className="spinner-border"></div>}
        {resources?.length === 0 && <p>No assets yet.</p>}
        {!!resources?.length && (
          <div className="row">
            {resources?.map((r) => (
              <ResourceCard key={r.id} resource={r} onSelect={onSelect} onEdit={onEdit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default ResourcesList;
