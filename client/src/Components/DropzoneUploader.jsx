import { useEffect, useState } from 'react';
import Dropzone from 'react-dropzone';
import { v4 as uuid } from 'uuid';
import PropTypes from 'prop-types';

import Api from '../Api';

function DropzoneUploader({ accept, className, children, disabled, id, maxFiles = 0, multiple, onRemoved, onUploaded, onUploading }) {
  const [files, setFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(
    () => () => {
      // Make sure to revoke the data uris to avoid memory leaks
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    },
    [files]
  );

  useEffect(() => {
    for (const status of statuses) {
      if (status.status === 'uploading') {
        break;
      } else if (status.status === 'pending') {
        status.status = 'uploading';
        setStatuses([...statuses]);
        if (onUploading) {
          onUploading(status);
        }
        const blob = {
          filename: status.file.name,
          content_type: status.file.type || 'application/octet-stream',
          byte_size: status.file.size,
        };
        Api.assets
          .create({ blob })
          .then((response) => {
            const { url, headers } = response.data.direct_upload;
            status.signedId = response.data.signed_id;
            return Api.assets.upload(url, headers, status.file);
          })
          .then(() => {
            status.status = 'uploaded';
            if (onUploaded) {
              return Promise.resolve(onUploaded(status));
            }
          })
          .then(() => {
            setStatuses([...statuses]);
          });
        break;
      }
    }
  }, [onUploaded, onUploading, statuses]);

  function onDropAccepted(acceptedFiles) {
    setFiles(
      acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )
    );
    const statuses = [];
    for (const file of acceptedFiles) {
      const status = {
        id: uuid(),
        file,
        status: 'pending', // uploading, uploaded, error
        signedId: null,
      };
      statuses.push(status);
    }
    setStatuses(statuses);
  }

  function onDropRejected(rejectedFiles) {
    setRejectedFiles(rejectedFiles);
  }

  function onRemove(status) {
    setFiles(files.filter((f) => f !== status.file));
    setStatuses(statuses.filter((s) => s !== status));
    if (onRemoved) {
      onRemoved(status);
    }
  }

  return (
    <Dropzone
      id={id}
      accept={accept}
      multiple={multiple}
      maxFiles={maxFiles}
      onDropAccepted={onDropAccepted}
      onDropRejected={onDropRejected}
      disabled={disabled || files.length > 0}>
      {({ getRootProps, getInputProps }) => (
        <div className={className}>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            {children({ statuses, onRemove, rejectedFiles })}
          </div>
        </div>
      )}
    </Dropzone>
  );
}

DropzoneUploader.propTypes = {
  accept: PropTypes.object,
  className: PropTypes.string,
  children: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  maxFiles: PropTypes.number,
  multiple: PropTypes.bool,
  onRemoved: PropTypes.func,
  onUploaded: PropTypes.func,
  onUploading: PropTypes.func,
};

export default DropzoneUploader;
