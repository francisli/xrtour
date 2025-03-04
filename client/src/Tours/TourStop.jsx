import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import Api from '../Api';
import Stop from '../Stops/Stop';
import StopsModal from '../Stops/StopsModal';
import StopsTable from '../Stops/StopsTable';
import { useAuthContext } from '../AuthContext';

function TourStop() {
  const { membership } = useAuthContext();
  const { TourId, TourStopId } = useParams();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [TourStop, setTourStop] = useState();
  const [isShowingStopsModal, setShowingStopsModal] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    Api.tours
      .stops(TourId)
      .get(TourStopId)
      .then((response) => {
        if (isCancelled) return;
        setTourStop(response.data);
      });
    return () => (isCancelled = true);
  }, [TourId, TourStopId]);

  async function onSelectTransition(stop) {
    onHideStopsModal();
    const newTourStop = { ...TourStop };
    newTourStop.TransitionStopId = stop.id;
    newTourStop.TransitionStop = stop;
    setTourStop(newTourStop);
    await Api.tours.stops(TourId).update(TourStopId, { TransitionStopId: stop.id });
    onClickTransition(undefined, stop);
  }

  function onClickTransition(type, stop) {
    navigate(`transitions/${stop.id}`);
  }

  async function onRemoveTransition() {
    const newTourStop = { ...TourStop };
    newTourStop.TransitionStopId = null;
    delete newTourStop.TransitionStop;
    setTourStop(newTourStop);
    await Api.tours.stops(TourId).update(TourStopId, { TransitionStopId: null });
  }

  function onHideStopsModal() {
    setShowingStopsModal(false);
    setSearchParams();
  }

  const isEditor = membership?.role !== 'VIEWER';
  const isArchived = !!TourStop?.Tour?.archivedAt;
  const isEditable = isEditor && !isArchived;

  return (
    <>
      <Stop StopId={TourStop?.StopId} transition={TourStop?.TransitionStop}>
        <h2>Transition</h2>
        <StopsTable
          type="TRANSITION"
          stops={TourStop?.TransitionStop ? [{ id: TourStop.TransitionStopId, Stop: TourStop.TransitionStop }] : []}
          onClick={onClickTransition}
          onRemove={onRemoveTransition}
          isEditable={isEditable}
        />
        <div className="mb-5">
          {isEditable && (
            <button
              onClick={() => {
                setShowingStopsModal(true);
              }}
              type="button"
              className="btn btn-primary">
              Set Transition
            </button>
          )}
        </div>
      </Stop>
      {isShowingStopsModal && (
        <StopsModal
          type="TRANSITION"
          types={['TRANSITION']}
          isShowing={true}
          onHide={onHideStopsModal}
          onSelect={onSelectTransition}
          startingAddress={TourStop?.Stop?.address}
        />
      )}
    </>
  );
}

export default TourStop;
