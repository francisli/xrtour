import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

function VersionsTable({ versions, onPromote, onPublish, onUnpublish }) {
  return (
    <table className="table table-hover table-striped">
      <thead>
        <tr>
          <th>Live?</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {versions?.length === 0 && (
          <tr>
            <td colSpan={3}>No published versions yet.</td>
          </tr>
        )}
        {versions?.map((v) => (
          <tr key={v.id}>
            <td>{v.isLive && <FontAwesomeIcon icon={faCheck} />}</td>
            <td>{DateTime.fromISO(v.createdAt).toLocaleString(DateTime.DATETIME_FULL)}</td>
            <td>
              {v.isStaging && v.isLive && (
                <button onClick={() => onPromote?.(v)} type="button" className="btn btn-sm btn-outline-primary">
                  Promote to Production
                </button>
              )}
              {v.isLive && (
                <button onClick={() => onUnpublish?.(v)} type="button" className="btn btn-sm btn-outline-secondary ms-2">
                  Unpublish
                </button>
              )}
              {!v.isLive && (
                <button onClick={() => onPublish?.(v)} type="button" className="btn btn-sm btn-outline-secondary ms-2">
                  Publish
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export default VersionsTable;
