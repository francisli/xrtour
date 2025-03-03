import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Spinner from './Spinner';

import DropzoneUploader from './DropzoneUploader';

function FormFileGroup({ accept, children, className, disabled, file, id, label, onChangeFile, onPreview, onUploading }) {
  function onRemoved() {
    const newFile = { ...file };
    newFile.key = null;
    if (newFile.keyURL) {
      delete newFile.keyURL;
    }
    newFile.originalName = null;
    newFile.duration = null;
    newFile.width = null;
    newFile.height = null;
    onChangeFile(newFile);
    onPreview();
  }

  function onUploaded(status) {
    const newFile = { ...file };
    newFile.key = status.signedId;
    newFile.originalName = status.file.name;
    onChangeFile(newFile);
    onPreview(status.file.preview);
  }

  return (
    <>
      <div className="mb-3">
        <label className="form-label" htmlFor="key">
          {label}
        </label>
        <fieldset className="d-flex align-items-center">
          <DropzoneUploader
            id={id}
            className={classNames('file-input', className)}
            accept={accept}
            multiple={false}
            disabled={disabled || (!!file.key && file.key !== '')}
            onRemoved={onRemoved}
            onUploaded={onUploaded}
            onUploading={onUploading}>
            {({ statuses, onRemove }) => {
              if (statuses.length > 0) {
                return statuses.map((s) => (
                  <div key={s.id} className="d-flex justify-content-between align-items-center">
                    <span className="me-3">{s.file.name}</span>
                    {(s.status === 'pending' || s.status === 'uploading') && <Spinner className="my-2" size="sm" />}
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
                    <span className="me-3">{file.originalName ?? file.key?.substring(file.key.lastIndexOf('/') + 1)}</span>
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
                    <div className="card-text text-muted clickable">
                      <b>Drag-and-drop</b> a file here,
                      <br />
                      or <b>click here</b> to browse and select a file.
                    </div>
                  </div>
                );
              }
            }}
          </DropzoneUploader>
          {children}
        </fieldset>
      </div>
    </>
  );
}
export default FormFileGroup;
