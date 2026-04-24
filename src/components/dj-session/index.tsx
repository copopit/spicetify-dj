import {
  createContext,
  type Dispatch,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TrackRow } from "@/types/spicetify-dj";

type IndexedTrack = {
  id?: string;
  val: {
    tempo: number;
  };
};

const bpmMap = new Map<string, number>();

const requestToPromise = <T,>(request: IDBRequest<T>) => {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const openDb = (name: string) => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getTrackId = (uri: string) => uri.split(":").at(-1) ?? "";

const hydrateTempo = (rows: TrackRow[]) => {
  let changed = false;
  const next = rows.map((row) => {
    const tempo = bpmMap.get(getTrackId(row.uri));
    if (row.tempo === tempo) return row;
    changed = true;
    return { ...row, tempo };
  });

  return changed ? next : rows;
};

const getMissingSongBpms = async (tracks: TrackRow[]) => {
  const missingIds = Array.from(
    new Set(
      tracks
        .filter((v) => v.tempo === undefined)
        .map((track) => getTrackId(track.uri)),
    ),
  ).filter((trackId) => trackId && !bpmMap.has(trackId));
  if (missingIds.length === 0) return [] as IndexedTrack[];

  const db = await openDb("dj-info-idb");

  try {
    if (!db.objectStoreNames.contains("tracks")) return [] as IndexedTrack[];

    const transaction = db.transaction("tracks", "readonly");
    const store = transaction.objectStore("tracks");

    const results = await Promise.all(
      missingIds.map((trackId) =>
        requestToPromise<IndexedTrack | undefined>(store.get(trackId)),
      ),
    );

    return results.filter(
      (track): track is IndexedTrack => track !== undefined,
    );
  } finally {
    db.close();
  }
};

export const getQeueueTracks = () => {
  const { track: current, nextTracks } = Spicetify.Queue;

  return [current, ...nextTracks.filter((t) => t.provider === "queue")].map(
    ({ contextTrack: { uid, uri, metadata } }) => ({
      uid,
      uri,
      artist_name: metadata?.artist_name,
      title: metadata?.title,
      duration: metadata?.duration,
      tempo: metadata ? bpmMap.get(getTrackId(uri)) : undefined,
    }),
  );
};

export const DjSessionContext = createContext<{
  autoPauseQueueContext: boolean;
  setAutoPauseQueueContext: Dispatch<React.SetStateAction<boolean>>;
  queueHistory: TrackRow[];
  setQueueHistory: Dispatch<React.SetStateAction<TrackRow[]>>;
  queue: TrackRow[] | [];
  setQueue: Dispatch<React.SetStateAction<TrackRow[]>>;
  startTime: Date;
  timer: Date;
} | null>(null);

export const DjSession = ({ children }: { children: ReactNode }) => {
  const [autoPauseQueueContext, setAutoPauseQueueContext] = useState(false);

  const [queueHistory, setQueueHistory] = useState<TrackRow[]>([]);
  const [queue, setQueue] = useState<TrackRow[]>([]);

  const startTime = useMemo(() => new Date(), []);

  const [timer, setTimer] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setTimer(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const queueUpdateFn = useCallback(async () => {
    const tracks = getQeueueTracks();

    const data = await getMissingSongBpms(tracks);
    data.forEach(({ id, val: { tempo } }) => {
      if (id) bpmMap.set(id, tempo);
    });

    setQueue(hydrateTempo(tracks));
  }, []);

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
    const fn = (e?: Event & { data?: { item?: { provider?: string } } }) => {
      if (autoPauseQueueContext && e?.data?.item?.provider === "context") {
        Spicetify.Player.pause();
        return;
      }
      const [current] = getQeueueTracks();
      setQueueHistory((h) => (current ? [...h, current] : h));
    };
    Spicetify.Player.addEventListener("songchange", fn);

    return () => {
      Spicetify.Player.removeEventListener("songchange", fn);
    };
  }, [autoPauseQueueContext]);

  // useEffect(() => {
  //   let isCancelled = false;

  //   void (async () => {
  //     // console.log("updated", [...queueHistory, ...queue]);
  //     try {
  //       const data = await getMissingSongBpms([
  //         ...newQueueHistory,
  //         ...newQueue,
  //       ]);
  //       if (!isCancelled) {
  //         data.forEach(({ id, val: { tempo } }) => {
  //           if (id) bpmMap.set(id, tempo);
  //         });
  //         setQueue((prev) => hydrateTempo(prev));
  //         setQueueHistory((prev) => hydrateTempo(prev));
  //       }
  //     } catch (error) {
  //       if (!isCancelled) {
  //         console.error("Error fetching track data", error);
  //       }
  //     }
  //   })();

  //   return () => {
  //     isCancelled = true;
  //   };
  // }, [newQueue, newQueueHistory]);

  return (
    <DjSessionContext.Provider
      value={{
        autoPauseQueueContext,
        setAutoPauseQueueContext,
        queueHistory,
        setQueueHistory,
        queue,
        setQueue,
        startTime,
        timer,
      }}
    >
      {children}
    </DjSessionContext.Provider>
  );
};
