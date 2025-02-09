import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faSquare } from '@fortawesome/free-solid-svg-icons';
import { v4 as uuid } from 'uuid';
import PropTypes from 'prop-types';

import TimeCode from 'shared/Components/TimeCode';

import AudioPlayer from '../Components/AudioPlayer';
import Api from '../Api';

function Recorder({ onCancel, onSave }) {
  const [context, setContext] = useState();
  const [stream, setStream] = useState();
  const [source, setSource] = useState();
  const [processor, setProcessor] = useState();
  const [isRecording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState();
  const [timer, setTimer] = useState();
  const [file, setFile] = useState();
  const [isLoading, setLoading] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(file?.preview), [file]);

  const [error, setError] = useState();

  async function onStart() {
    const newContext = new AudioContext();
    await newContext.audioWorklet.addModule('/workers/encoder.js');
    setContext(newContext);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(newStream);
      const newSource = newContext.createMediaStreamSource(newStream);
      setSource(newSource);
      const newProcessor = new AudioWorkletNode(newContext, 'encoder-processor', {
        processorOptions: { sampleRate: newContext.sampleRate },
      });
      newProcessor.port.onmessage = (event) => {
        const newFile = new File(event.data, `${uuid()}.mp3`, {
          type: 'audio/mpeg',
          lastModified: Date.now(),
        });
        newFile.preview = URL.createObjectURL(newFile);
        setFile(newFile);
      };
      setProcessor(newProcessor);
      newSource.connect(newProcessor).connect(newContext.destination);
      newContext.resume();
      setRecording(true);
      const startTime = Date.now();
      setElapsed(0);
      setTimer(
        setInterval(() => {
          setElapsed(Math.ceil((Date.now() - startTime) / 1000));
        }, 250)
      );
    } catch (err) {
      setError(err);
    }
  }

  async function onStop() {
    source?.disconnect();
    processor?.port.postMessage('finish');
    processor?.disconnect();
    stream?.getAudioTracks().forEach((track) => track.stop());
    context?.close();
    setRecording(false);
    clearInterval(timer);
  }

  async function onSaveInternal() {
    setLoading(true);
    const blob = {
      filename: file.name,
      content_type: file.type,
      byte_size: file.size,
    };
    const response = await Api.assets.create({ blob });
    const { url, headers } = response.data.direct_upload;
    await Api.assets.upload(url, headers, file);
    const { signed_id } = response.data;
    onSave?.({ ...blob, signed_id, duration: elapsed });
  }

  return (
    <div className="recorder d-flex align-items-center">
      {!isRecording && !file && (
        <>
          <button onClick={onStart} className="btn btn-outline-danger" type="button">
            <FontAwesomeIcon icon={faCircle} /> Start
          </button>
          &nbsp;
          <button onClick={() => onCancel()} className="btn btn-outline-secondary" type="button">
            Cancel
          </button>
        </>
      )}
      {isRecording && (
        <>
          <button onClick={onStop} className="btn btn-outline-danger me-2" type="button">
            <FontAwesomeIcon icon={faSquare} /> Stop
          </button>
          <span className="me-2">Recording:</span>
          <TimeCode seconds={elapsed} />
        </>
      )}
      {error && (
        <>
          <span className="me-3">{error}</span>
        </>
      )}
      {!!file && (
        <>
          <AudioPlayer className="flex-grow-1 me-3" src={file.preview} onDurationChange={(newDuration) => setElapsed(newDuration)} />
          <div className="spinner-border me-3" style={{ visibility: isLoading ? 'visible' : 'hidden' }}></div>
          <button disabled={isLoading} onClick={() => onSaveInternal()} className="btn btn-primary me-2" type="button">
            Save
          </button>
          <button disabled={isLoading} onClick={() => onCancel()} className="btn btn-outline-secondary" type="button">
            Discard
          </button>
        </>
      )}
    </div>
  );
}

Recorder.propTypes = {
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
};

export default Recorder;
