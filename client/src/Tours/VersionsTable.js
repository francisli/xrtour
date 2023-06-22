import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

function VersionsTable({ versions }) {
  return (
    <table className="table table-hover table-striped">
      <thead>
        <tr>
          <th>Date</th>
          <th>isLive</th>
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
          <tr>
            <td>{DateTime.fromISO(v.createdAt).toLocaleString(DateTime.DATETIME_FULL)}</td>
            <td>{v.isLive && <FontAwesomeIcon icon={faCheck} />}</td>
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export default VersionsTable;
