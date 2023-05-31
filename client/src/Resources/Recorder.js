import { useEffect, useState } from 'react';

function Recorder({ onCancel }) {
  const [state, setState] = useState('INIT');

  const [context, setContext] = useState();
  const [stream, setStream] = useState();
  const [source, setSource] = useState();
  const [processor, setProcessor] = useState();
  const [isRecording, setRecording] = useState(false);

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
      const newProcessor = new AudioWorkletNode(newContext, 'encoder-processor', {});
      newProcessor.port.onmessage = (event) => {
        const file = new File(event.data, 'me-at-thevoice.mp3', {
          type: 'audio/mp3',
          lastModified: Date.now(),
        });
        const player = new Audio(URL.createObjectURL(file));
        player.play();
        console.log('playing?');
      };
      setProcessor(newProcessor);
      newSource.connect(newProcessor).connect(newContext.destination);
      newContext.resume();
      setRecording(true);
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
  }

  return (
    <>
      {!isRecording && (
        <button onClick={onStart} className="btn btn-outline-secondary" type="button">
          Start
        </button>
      )}
      {isRecording && (
        <button onClick={onStop} className="btn btn-outline-secondary" type="button">
          Stop
        </button>
      )}
      &nbsp;
      <button onClick={() => onCancel()} className="btn btn-outline-secondary" type="button">
        Cancel
      </button>
    </>
  );
}
export default Recorder;
