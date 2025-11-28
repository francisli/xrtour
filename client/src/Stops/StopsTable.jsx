import { useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { pluralize } from 'inflection';
import PropTypes from 'prop-types';

import ConfirmModal from '../Components/ConfirmModal';

import './StopsTable.scss';

function StopsTable({ type = 'STOP', stops, onClick, onRemove, onReorderStops, isEditable }) {
  const [isConfirmRemoveShowing, setConfirmRemoveShowing] = useState(false);
  const [selectedStop, setSelectedStop] = useState();

  function onClickRemove(event, stop) {
    event.stopPropagation();
    setSelectedStop(stop);
    setConfirmRemoveShowing(true);
  }

  function onConfirmRemove(stop) {
    setConfirmRemoveShowing(false);
    onRemove?.(stop);
  }

  function onReorderStopsInternal(newStops) {
    onReorderStops?.(newStops);
  }

  return (
    <>
      <table className="stops-table table table-striped">
        <thead>
          <tr>
            <th className="stops-table__col-num">#</th>
            {type === 'STOP' && (
              <>
                <th className="stops-table__col-name">Name</th>
                <th>Address</th>
              </>
            )}
            {type !== 'STOP' && <th>Name</th>}
            <th className="stops-table__col-actions"></th>
          </tr>
        </thead>
        {!stops && (
          <tbody>
            <tr>
              <td colSpan="4">
                <div className="spinner-border"></div>
              </td>
            </tr>
          </tbody>
        )}
        {stops?.length === 0 && (
          <tbody>
            <tr>
              <td colSpan="4">No {pluralize(type).toLocaleLowerCase()} yet.</td>
            </tr>
          </tbody>
        )}
        {stops && stops.length > 0 && (
          <ReactSortable tag="tbody" list={stops} setList={onReorderStopsInternal}>
            {stops?.map((s, i) => (
              <tr key={s.id} onClick={() => onClick(type, s)} className="clickable">
                <td>{i + 1}</td>
                <td>{s.Stop.name}</td>
                {type === 'STOP' && <td>{s.Stop.address}</td>}
                <td className="stops-table__col-actions">
                  {isEditable && (
                    <button onClick={(event) => onClickRemove(event, s)} type="button" className="btn btn-sm btn-outline-danger">
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </ReactSortable>
        )}
      </table>
      <ConfirmModal
        isShowing={isConfirmRemoveShowing}
        onCancel={() => setConfirmRemoveShowing(false)}
        onOK={() => onConfirmRemove(selectedStop)}>
        Are you sure you wish to remove <b>{selectedStop?.Stop.name}</b>?
      </ConfirmModal>
    </>
  );
}

StopsTable.propTypes = {
  type: PropTypes.string,
  stops: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      Stop: PropTypes.shape({
        names: PropTypes.object.isRequired,
        variants: PropTypes.arrayOf(
          PropTypes.shape({
            code: PropTypes.string.isRequired,
          })
        ),
        address: PropTypes.string,
      }),
    })
  ),
  onClick: PropTypes.func,
  onRemove: PropTypes.func,
  onReorderStops: PropTypes.func,
  isEditable: PropTypes.bool,
};

export default StopsTable;
