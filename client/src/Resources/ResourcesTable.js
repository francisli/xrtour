import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPen, faTrashCan, faXmark } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

import ConfirmModal from '../Components/ConfirmModal';
import TimeCode from '../Components/TimeCode';

import './ResourcesTable.scss';
import { useAuthContext } from '../AuthContext';

function ResourcesTable({ variant, resources, onClick, onChange, onRemove }) {
  const { membership } = useAuthContext();
  const [selectedResource, setSelectedResource] = useState();
  const [selectedResourceClone, setSelectedResourceClone] = useState();
  const [isEditing, setEditing] = useState(false);
  const [isConfirmRemoveShowing, setConfirmRemoveShowing] = useState(false);

  function onClickEdit(resource) {
    setSelectedResource(resource);
    setSelectedResourceClone(JSON.parse(JSON.stringify(resource)));
    setEditing(true);
  }

  function onChangeTimeCode(name, newValue) {
    selectedResource[name] = newValue;
  }

  function onTogglePause(resource, newValue) {
    resource.pauseAtEnd = newValue;
    onChange(resource);
  }

  function onClickSubmitEdit() {
    onChange(selectedResource);
    setSelectedResource(undefined);
    setEditing(false);
  }

  function onClickCancelEdit() {
    selectedResource.start = selectedResourceClone.start;
    selectedResource.end = selectedResourceClone.end;
    setSelectedResource(undefined);
    setEditing(false);
  }

  function onClickRemove(resource) {
    setSelectedResource(resource);
    setConfirmRemoveShowing(true);
  }

  function onConfirmRemove(resource) {
    setConfirmRemoveShowing(false);
    onRemove(resource);
  }

  return (
    <>
      <table className={classNames('resources-table table table-striped', { 'table-hover': !!onClick })}>
        <thead>
          <tr>
            <th className="resources-table__col-num">#</th>
            <th className="resources-table__col-type">Type</th>
            <th className="resources-table__col-name">Name</th>
            <th className="resources-table__col-timeline">
              <div className="d-flex justify-content-between">
                <span>Timeline</span>
                <span>Pause?</span>
              </div>
            </th>
            <th className="resources-table__col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!resources && (
            <tr>
              <td colSpan="5">
                <div className="spinner-border"></div>
              </td>
            </tr>
          )}
          {resources?.length === 0 && (
            <tr>
              <td colSpan="5">No assets yet.</td>
            </tr>
          )}
          {resources?.map((r, i) => (
            <tr key={r.id} onClick={() => onClick?.(r)} className={classNames({ clickable: !!onClick })}>
              <td>{i + 1}</td>
              <td>{r.Resource.type}</td>
              <td>{r.Resource.name}</td>
              <td>
                <div className="d-flex justify-content-between">
                  <span>
                    <TimeCode
                      onChange={(newValue) => onChangeTimeCode('start', newValue)}
                      isEditing={isEditing && selectedResource === r}
                      seconds={r.start}
                    />{' '}
                    -{' '}
                    {r.Resource.type === 'AUDIO' && (
                      <TimeCode seconds={r.start + r.Resource.Files.find((f) => f.variant === variant.code).duration} />
                    )}
                    {r.Resource.type !== 'AUDIO' &&
                      (r.end || (isEditing && selectedResource === r) ? (
                        <TimeCode
                          onChange={(newValue) => onChangeTimeCode('end', newValue)}
                          isEditing={isEditing && selectedResource === r}
                          seconds={r.end}
                        />
                      ) : (
                        'End'
                      ))}
                  </span>
                  {r.Resource.type === 'AUDIO' && !(isEditing && selectedResource === r) && (
                    <span>
                      <input
                        onChange={(event) => onTogglePause(r, event.target.checked)}
                        type="checkbox"
                        name="pauseAtEnd"
                        checked={r.pauseAtEnd}
                        className="form-check-input"
                      />
                    </span>
                  )}
                </div>
              </td>
              <td className="resources-table__col-actions">
                {membership.role !== 'VIEWER' && (
                  <>
                    {isEditing && selectedResource === r && (
                      <>
                        <button onClick={onClickSubmitEdit} className="btn btn-sm btn-outline-success">
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        &nbsp;
                        <button onClick={onClickCancelEdit} className="btn btn-sm btn-outline-secondary">
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </>
                    )}
                    {(!isEditing || selectedResource !== r) && (
                      <>
                        <button
                          onClick={() => onClickEdit(r)}
                          disabled={isEditing && selectedResource !== r}
                          className="btn btn-sm btn-outline-secondary">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        &nbsp;
                        <button onClick={() => onClickRemove(r)} className="btn btn-sm btn-outline-danger">
                          <FontAwesomeIcon icon={faTrashCan} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmModal
        isShowing={isConfirmRemoveShowing}
        onCancel={() => setConfirmRemoveShowing(false)}
        onOK={() => onConfirmRemove(selectedResource)}>
        Are you sure you wish to remove <b>{selectedResource?.Resource?.name}</b>?
      </ConfirmModal>
    </>
  );
}
export default ResourcesTable;
