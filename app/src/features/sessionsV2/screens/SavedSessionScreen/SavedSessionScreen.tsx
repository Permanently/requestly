import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getAuthInitialization, getUserAuthDetails } from "store/selectors";
import { getRecording } from "backend/sessionRecording/getRecording";
import { sessionRecordingActions } from "store/features/session-recording/slice";
import { RQSessionEvents } from "@requestly/web-sdk";
import { decompressEvents } from "views/features/sessions/SessionViewer/sessionEventsUtils";
import { getCurrentlyActiveWorkspace } from "store/features/teams/selectors";
import PageLoader from "components/misc/PageLoader";
import "./savedSessionScreen.scss";
import { SavedSessionViewer } from "./components/SavedSessionViewer/SavedSessionViewer";

export const SavedSessionScreen: React.FC = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const user = useSelector(getUserAuthDetails);
  const workspace = useSelector(getCurrentlyActiveWorkspace);
  const [isFetching, setIsFetching] = useState(false);

  const hasAuthInitialized = useSelector(getAuthInitialization);

  useEffect(() => {
    if (!hasAuthInitialized) return;

    setIsFetching(true);

    getRecording(id, user?.details?.profile?.uid, workspace?.id, user?.details?.profile?.email)
      .then((res) => {
        // setShowPermissionError(false);
        dispatch(sessionRecordingActions.setSessionRecordingMetadata({ id, ...res.payload }));
        try {
          const recordedSessionEvents: RQSessionEvents = decompressEvents(res.events);
          dispatch(sessionRecordingActions.setEvents(recordedSessionEvents));
        } catch (e) {
          const err = new Error("Failed to decompress session events");
          err.name = "BadSessionEvents";
          throw err;
        } finally {
          setIsFetching(false);
        }
      })
      .catch((err) => {
        switch (err.name) {
          case "NotFound":
            // setShowNotFoundError(true);
            break;
          case "BadSessionEvents":
            // setShowBadSessionError(true);
            break;
          case "PermissionDenied":
          default:
          // setShowPermissionError(true);
        }
      });
  }, [dispatch, hasAuthInitialized, id, user?.details?.profile?.uid, user?.details?.profile?.email, workspace?.id]);

  if (isFetching) {
    return <PageLoader message="Fetching session details..." />;
  }

  return <SavedSessionViewer />;
};