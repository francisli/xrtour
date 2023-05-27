import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

import './ResourcesTable.scss';
import ConfirmModal from '../Components/ConfirmModal';

function ResourcesTable({ resources, onRemove }) {
  const [isConfirmRemoveShowing, setConfirmRemoveShowing] = useState(false);
  const [selectedResource, setSelectedResource] = useState();

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
      <table className="resources-table table table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Type</th>
            <th>Name</th>
            <th>Timeline</th>
            <th>Actions</th>
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
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td>{r?.Resource.type}</td>
              <td>{r?.Resource.name}</td>
              <td></td>
              <td>
                <button onClick={() => onClickRemove(r)} className="btn btn-sm btn-outline-danger">
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
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
