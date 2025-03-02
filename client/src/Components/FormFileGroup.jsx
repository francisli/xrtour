import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import mime from 'mime/lite';
import PropTypes from 'prop-types';

import DropzoneUploader from './DropzoneUploader';

function FormFileGroup({ accept, className, file, id, label, onChangeFile, onUploading }) {
  function onRemoved() {}

  function onUploaded(status) {
    const newFile = { ...file };
    newFile.key = status.signedId;
    newFile.originalName = status.file.name;
    console.log('???', status, newFile);
    onChangeFile(newFile);
  }

  return (
    <>
      <div className="mb-3">
        <label className="form-label" htmlFor="key">
          {label}
        </label>
        <DropzoneUploader
          id={id}
          className={classNames('file-input', className)}
          accept={accept}
          multiple={false}
          disabled={!!file.key && file.key !== ''}
          onRemoved={onRemoved}
          onUploaded={onUploaded}>
          {({ statuses, onRemove }) => {
            if (statuses.length > 0) {
              return statuses.map((s) => (
                <div key={s.id} className="file-input__file">
                  <span className="me-3">{s.file.name}</span>
                  {(s.status === 'pending' || s.status === 'uploading') && (
                    <div className="spinner-border file-input__spinner" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  )}
                  {!(s.status === 'pending' || s.status === 'uploading') && (
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onRemove(s)}>
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  )}
                </div>
              ));
            } else if (statuses.length === 0 && file.key) {
              return (
                <div className="d-flex justify-content-between align-items-center">
                  <span className="me-3">{file.originalName}</span>
                  <div>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRemoved}>
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                    <a className="btn btn-sm btn-outline-secondary ms-2" download={file.originalName} href={file.keyURL}>
                      <FontAwesomeIcon icon={faDownload} />
                    </a>
                  </div>
                </div>
              );
            } else if (statuses.length === 0 && !file.key) {
              return (
                <div className="card-body">
                  <div className="card-text text-muted">Drag-and-drop a file here, or click here to browse and select a file.</div>
                </div>
              );
            }
          }}
        </DropzoneUploader>
      </div>
    </>
  );
}
export default FormFileGroup;
