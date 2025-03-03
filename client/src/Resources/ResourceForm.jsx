import { useEffect, useState } from 'react';
import { StatusCodes } from 'http-status-codes';
import PropTypes from 'prop-types';

import { useAuthContext } from '../AuthContext';
import Api from '../Api';
import AudioPlayer from '../Components/AudioPlayer';
import ConfirmModal from '../Components/ConfirmModal';
import FormGroup from '../Components/FormGroup';
import FormFileGroup from '../Components/FormFileGroup';
import Spinner from '../Components/Spinner';
import URLText from '../Components/URLText';
import UnexpectedError from '../UnexpectedError';
import ValidationError from '../ValidationError';
import VariantTabs from '../Components/VariantTabs';

const ACCEPTED_FILES = {
  '3D_MODEL': {
    'model/*': ['.glb'],
  },
  AUDIO: {
    'audio/*': ['.mp3', '.mp4', '.m4a'],
  },
  AUDIO_SUBTITLES: {
    'text/*': ['.vtt'],
  },
  IMAGE: {
    'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
  },
  IMAGE_OVERLAY: {
    'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
  },
  IMAGE_SPHERE: {
    'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
  },
};
Object.freeze(ACCEPTED_FILES);

function ResourceForm({ ResourceId, type, onCancel, onCreate, onUpdate }) {
  const { membership } = useAuthContext();

  const [resource, setResource] = useState();
  const [variant, setVariant] = useState();
  const [preview, setPreview] = useState();
  const [isUploading, setUploading] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState();

  const [isGenerating, setGenerating] = useState(false);
  const [previewSubtitles, setPreviewSubtitles] = useState();

  const [isConfirmDeleteShowing, setConfirmDeleteShowing] = useState(false);
  const [deleteError, setDeleteError] = useState();
  const [ReactPhotoSphereViewer, setReactPhotoSphereViewer] = useState();

  useEffect(() => {
    import('react-photo-sphere-viewer').then((pkg) => setReactPhotoSphereViewer(pkg.ReactPhotoSphereViewer));
  }, []);

  useEffect(() => {
    let isCancelled = false;
    if (membership && !ResourceId) {
      setResource({
        TeamId: membership.TeamId,
        name: '',
        type,
        variants: [...membership.Team.variants],
        data: {},
        Files: [],
      });
      setVariant(membership.Team.variants[0]);
    }
    if (ResourceId) {
      Api.resources.get(ResourceId).then((response) => {
        if (isCancelled) return;
        setResource(response.data);
        setVariant(response.data.variants[0]);
      });
    }
    return () => (isCancelled = true);
  }, [membership, ResourceId, type]);

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let response;
      if (ResourceId) {
        response = await Api.resources.update(ResourceId, resource);
        onUpdate(response.data);
      } else {
        response = await Api.resources.create(resource);
        onCreate(response.data);
      }
    } catch (error) {
      if (error.response?.status === StatusCodes.UNPROCESSABLE_ENTITY) {
        setError(new ValidationError(error.response.data));
      } else {
        setError(new UnexpectedError());
      }
    } finally {
      setLoading(false);
    }
  }

  let variantFile = resource?.Files?.find((f) => f.variant === variant?.code);
  if (!variantFile) {
    variantFile = { variant: variant?.code, externalURL: '', key: '' };
    resource?.Files?.push(variantFile);
    if (resource) {
      setResource({ ...resource });
    }
  }
  let variantFileSubtitles = resource?.Files?.find((f) => f.variant === `${variant?.code}-vtt`);
  if (!variantFileSubtitles && resource?.type === 'AUDIO') {
    variantFileSubtitles = { variant: `${variant?.code}-vtt`, externalURL: '', key: '' };
    resource?.Files?.push(variantFileSubtitles);
    if (resource) {
      setResource({ ...resource });
    }
  }

  function onChange(event) {
    const newResource = { ...resource };
    const { name, value } = event.target;
    newResource[name] = value;
    setResource(newResource);
  }

  function onChangeVariant(event) {
    const newResource = { ...resource };
    const { name, value } = event.target;
    variantFile[name] = value;
    setResource(newResource);
  }

  function onChangeVariantFile(newFile) {
    const newResource = { ...resource };
    const index = newResource.Files.indexOf(variantFile);
    if (index >= 0) {
      newResource.Files[index] = newFile;
    }
    setResource(newResource);
    setUploading();
  }

  function onPreviewAudioDurationChange(newDuration) {
    const newVariantFile = { ...variantFile };
    newVariantFile.duration = newDuration;
    const newResource = { ...resource };
    const index = newResource.Files.indexOf(variantFile);
    if (index >= 0) {
      newResource.Files[index] = newVariantFile;
    }
    setResource(newResource);
  }

  function onPreviewImageLoad(event) {
    const { target: img } = event;
    const newVariantFile = { ...variantFile };
    newVariantFile.width = img.naturalWidth;
    newVariantFile.height = img.naturalHeight;
    const newResource = { ...resource };
    const index = newResource.Files.indexOf(variantFile);
    if (index >= 0) {
      newResource.Files[index] = newVariantFile;
    }
    setResource(newResource);
  }

  function onChangeVariantFileSubtitles(newFile) {
    const newResource = { ...resource };
    const index = newResource.Files.indexOf(variantFileSubtitles);
    if (index >= 0) {
      newResource.Files[index] = newFile;
    }
    setResource(newResource);
    setUploading();
  }

  async function onDelete() {
    setConfirmDeleteShowing(false);
    try {
      await Api.resources.delete(resource.id);
      onUpdate?.();
    } catch (error) {
      setDeleteError(error);
    }
  }

  async function onGenerate(event) {
    event.preventDefault();
    setGenerating(true);
    const params = {};
    if (variantFile.id) {
      params.id = variantFile.id;
    } else if (variantFile.key) {
      params.key = variantFile.key;
    }
    const response = await Api.files.transcribe(params);
    const { data } = response;
    if (data['$metadata']?.httpStatusCode === StatusCodes.OK) {
      const jobName = data.TranscriptionJob?.TranscriptionJobName;
      pollGenerate(jobName);
    } else {
      setGenerating(false);
    }
  }

  function pollGenerate(jobName) {
    setTimeout(async () => {
      const response = await Api.files.poll(jobName);
      const { data } = response;
      if (data.TranscriptionJob?.TranscriptionJobStatus == 'COMPLETED') {
        const { TranscriptVttFileUri } = data.TranscriptionJob.Transcript;
        const key = TranscriptVttFileUri.substring(TranscriptVttFileUri.indexOf('uploads/') + 8, TranscriptVttFileUri.indexOf('?'));
        const newResource = { ...resource };
        variantFileSubtitles.key = key;
        variantFileSubtitles.keyURL = TranscriptVttFileUri;
        variantFileSubtitles.originalName = key.substring(key.lastIndexOf('/') + 1);
        setResource(newResource);
        setGenerating(false);
        setPreviewSubtitles(TranscriptVttFileUri);
      } else {
        pollGenerate(jobName);
      }
    }, 1000);
  }

  return (
    <div className="row h-100">
      <div className="col-md-6">
        {variant && resource && (
          <form onSubmit={onSubmit}>
            {error && error.message && <div className="alert alert-danger">{error.message}</div>}
            <fieldset disabled={isLoading || isUploading}>
              <FormGroup name="name" label="Name" onChange={onChange} record={resource} error={error} />
              <VariantTabs variants={resource.variants} current={variant} setVariant={setVariant} />
              {resource.type === 'AR_LINK' && (
                <FormGroup
                  name="externalURL"
                  label="External URL"
                  onChange={onChangeVariant}
                  disabled={variantFile.key}
                  value={variantFile.externalURL}
                  error={error}
                />
              )}
              {resource.type !== 'AR_LINK' && (
                <FormFileGroup
                  id="file"
                  label="File"
                  accept={ACCEPTED_FILES[resource.type]}
                  file={variantFile}
                  onPreview={setPreview}
                  onUploading={setUploading}
                  onChangeFile={onChangeVariantFile}
                />
              )}
              {resource.type === 'AUDIO' && (
                <FormFileGroup
                  id="vttfile"
                  label="Subtitle File (.vtt)"
                  accept={ACCEPTED_FILES['AUDIO_SUBTITLES']}
                  disabled={isGenerating}
                  file={variantFileSubtitles}
                  onPreview={setPreviewSubtitles}
                  onUploading={setUploading}
                  onChangeFile={onChangeVariantFileSubtitles}>
                  {!variantFileSubtitles.key && (
                    <>
                      <span>&nbsp;or&nbsp;</span>
                      <button
                        disabled={!variantFile?.key || isGenerating}
                        onClick={onGenerate}
                        type="button"
                        className="btn btn-outline-primary">
                        <span style={{ display: 'inline-block', width: '70px' }}>{isGenerating ? <Spinner size="sm" /> : 'Generate'}</span>
                      </button>
                    </>
                  )}
                </FormFileGroup>
              )}
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <button className="btn btn-primary" type="submit">
                    Submit
                  </button>
                  &nbsp;
                  <button onClick={onCancel} className="btn btn-secondary" type="button">
                    Cancel
                  </button>
                </div>
                <button onClick={() => setConfirmDeleteShowing(true)} className="btn btn-outline-danger" type="button">
                  Delete
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </div>
      <div className="col-md-6 h-100">
        <label className="mb-2">Preview</label>
        <div className="h-75">
          {type === 'AR_LINK' && variantFile.externalURL && (
            <a className="btn btn-outline-primary" href={variantFile.externalURL} target="_blank">
              Open Link in new Tab
            </a>
          )}
          {variantFile?.keyURL && (
            <>
              {type === '3D_MODEL' && <model-viewer autoplay camera-controls class="w-100 h-100" src={variantFile.keyURL} />}
              {type === 'AUDIO' && (
                <>
                  <AudioPlayer className="flex-grow-1" src={variantFile.keyURL} />
                  {variantFileSubtitles?.keyURL && (
                    <>
                      <label className="mt-3">Subtitles</label>
                      <br />
                      <URLText url={variantFileSubtitles.keyURL} />
                    </>
                  )}
                </>
              )}
              {(type === 'IMAGE' || type === 'IMAGE_OVERLAY') && (
                <img className="img-fluid" alt={variantFile.originalName} src={variantFile.keyURL} />
              )}
              {type === 'IMAGE_SPHERE' && ReactPhotoSphereViewer && (
                <ReactPhotoSphereViewer src={variantFile.keyURL} height="100%" width="100%" />
              )}
            </>
          )}
          {preview && (
            <>
              {type === '3D_MODEL' && <model-viewer autoplay camera-controls class="w-100 h-100" src={preview} />}
              {type === 'AUDIO' && (
                <>
                  <AudioPlayer className="flex-grow-1" src={preview} onDurationChange={onPreviewAudioDurationChange} />
                  {previewSubtitles && (
                    <>
                      <label className="mt-3">Subtitles</label>
                      <br />
                      <URLText url={previewSubtitles} />
                    </>
                  )}
                </>
              )}
              {(type === 'IMAGE' || type === 'IMAGE_OVERLAY') && (
                <img className="img-fluid" alt={variantFile?.originalName} src={preview} onLoad={onPreviewImageLoad} />
              )}
              {type === 'IMAGE_SPHERE' && ReactPhotoSphereViewer && <ReactPhotoSphereViewer src={preview} height="100%" width="100%" />}
            </>
          )}
        </div>
      </div>
      <ConfirmModal nested isShowing={isConfirmDeleteShowing} onCancel={() => setConfirmDeleteShowing(false)} onOK={() => onDelete()}>
        Are you sure you wish to delete <b>{resource?.name}</b>?
      </ConfirmModal>
      <ConfirmModal nested title="An error has occurred" isShowing={!!deleteError} onOK={() => setDeleteError()}>
        {deleteError?.response?.data?.message ?? 'An unexpected error has occurred, please try again later or contact support.'}
      </ConfirmModal>
    </div>
  );
}

ResourceForm.propTypes = {
  ResourceId: PropTypes.string,
  type: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onCreate: PropTypes.func,
  onUpdate: PropTypes.func,
};

export default ResourceForm;
