import {
  createContext,
  type Dispatch,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  getCachedTrackInfo,
  getTrackId,
  getTrackInfos,
} from "@/api/track-info";
import type { TrackRow } from "@/types/spicetify-dj";
import {
  getPlayedTracks,
  type SessionState,
  updateSession,
} from "./session-state";

type PlaybackItem = Spicetify.ContextTrack & { provider?: string };

const getPlaybackItem = () =>
  (Spicetify.Player as unknown as { data?: { item?: PlaybackItem } }).data
    ?.item;

const getTempo = (uri: string) => getCachedTrackInfo(getTrackId(uri))?.tempo;

const hydrateTempo = (rows: TrackRow[]) => {
  let changed = false;
  const next = rows.map((row) => {
    const tempo = getTempo(row.uri);
    if (row.tempo === tempo) return row;
    changed = true;
    return { ...row, tempo };
  });

  return changed ? next : rows;
};

export const getQeueueTracks = (item = getPlaybackItem()) => {
  const snapshot = Spicetify.Queue;
  const current = item ?? snapshot?.track?.contextTrack;
  if (!current) return [];
  const next = (snapshot?.nextTracks ?? [])
    .filter((track) => track.provider === "queue")
    .map((track) => track.contextTrack)
    .filter((track) => !current?.uid || track.uid !== current.uid);

  return [...(current ? [current] : []), ...next].map(
    ({ uid, uri, metadata }) => ({
      uid,
      uri,
      artist_name: metadata?.artist_name,
      title: metadata?.title,
      duration: metadata?.duration,
      tempo: metadata ? getTempo(uri) : undefined,
    }),
  );
};

export const DjSessionContext = createContext<{
  autoPauseQueueContext: boolean;
  setAutoPauseQueueContext: Dispatch<React.SetStateAction<boolean>>;
  queueHistory: TrackRow[];
  playedTracks: TrackRow[];
  setQueueHistory: Dispatch<React.SetStateAction<TrackRow[]>>;
  queue: TrackRow[] | [];
  setQueue: Dispatch<React.SetStateAction<TrackRow[]>>;
  startTime?: Date;
  startSession: () => void;
  timer?: Date;
} | null>(null);

export const DjSession = ({ children }: { children: ReactNode }) => {
  const [autoPauseQueueContext, setAutoPauseQueueContext] = useState(false);

  const [session, setSession] = useState<SessionState>({
    history: [],
    queue: [],
  });

  const setQueueHistory: Dispatch<React.SetStateAction<TrackRow[]>> = (
    action,
  ) => {
    setSession((previous) => ({
      ...previous,
      history: typeof action === "function" ? action(previous.history) : action,
    }));
  };

  const setQueue: Dispatch<React.SetStateAction<TrackRow[]>> = (action) => {
    setSession((previous) => ({
      ...previous,
      queue: typeof action === "function" ? action(previous.queue) : action,
    }));
  };

  const [startTime, setStartTime] = useState<Date>();

  const [timer, setTimer] = useState<Date>();

  useEffect(() => {
    const t = setInterval(() => setTimer(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const queueUpdateFn = useCallback(() => {
    const item = getPlaybackItem();
    const tracks = getQeueueTracks(item);
    const provider = item?.provider ?? Spicetify.Queue?.track?.provider;
    const blockCurrent = autoPauseQueueContext && provider === "context";

    setSession((previous) => updateSession(previous, tracks, blockCurrent));
    if (blockCurrent) Spicetify.Player.pause();

    const missingIds = tracks
      .filter((track) => track.tempo === undefined)
      .map((track) => getTrackId(track.uri))
      .filter((id): id is string => id !== undefined);
    if (missingIds.length === 0) return;

    void getTrackInfos(missingIds)
      .then(() => {
        setSession((previous) => ({
          current: previous.current
            ? hydrateTempo([previous.current])[0]
            : undefined,
          history: hydrateTempo(previous.history),
          queue: hydrateTempo(previous.queue),
        }));
      })
      .catch((error) => console.error("Error fetching track BPMs", error));
  }, [autoPauseQueueContext]);

  useEffect(() => {
    void queueUpdateFn();
  }, [queueUpdateFn]);

  useEffect(() => {
    Spicetify.Platform.PlayerAPI._events.addListener(
      "queue_update",
      queueUpdateFn,
    );

    return () => {
      Spicetify.Platform.PlayerAPI._events.removeListener(
        "queue_update",
        queueUpdateFn,
      );
    };
  }, [queueUpdateFn]);

  useEffect(() => {
    Spicetify.Player.addEventListener("songchange", queueUpdateFn);

    return () => {
      Spicetify.Player.removeEventListener("songchange", queueUpdateFn);
    };
  }, [queueUpdateFn]);

  return (
    <DjSessionContext.Provider
      value={{
        autoPauseQueueContext,
        setAutoPauseQueueContext,
        queueHistory: session.history,
        playedTracks: getPlayedTracks(session),
        setQueueHistory,
        queue: session.queue,
        setQueue,
        startTime,
        startSession: () => {
          setStartTime(new Date());
          setTimer(new Date());
        },
        timer,
      }}
    >
      {children}
    </DjSessionContext.Provider>
  );
};
