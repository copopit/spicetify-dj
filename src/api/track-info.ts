export type TrackInfo = {
  id: string;
  tempo: number;
  key?: number;
  mode?: number;
  timeSignature?: number;
  danceability?: number;
  energy?: number;
  loudness?: number;
  valence?: number;
  fetchedAt: number;
};

type AudioFeatures = {
  id?: string;
  tempo?: number;
  key?: number;
  mode?: number;
  time_signature?: number;
  danceability?: number;
  energy?: number;
  loudness?: number;
  valence?: number;
} | null;

const DB_NAME = "spicetify-dj";
const DB_VERSION = 1;
const STORE = "tracks";
const BATCH_SIZE = 100;
const AUDIO_FEATURES_URL =
  "https://spclient.wg.spotify.com/audio-attributes/v1/audio-features";
const TRACK_ID = /^[0-9A-Za-z]{22}$/;

const cache = new Map<string, TrackInfo>();
// Tracks Spotify has no features for; skipped for the rest of the session.
const unavailable = new Set<string>();
const pending = new Map<string, Promise<TrackInfo | undefined>>();

let dbPromise: Promise<IDBDatabase> | undefined;

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const openDb = () => {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    dbPromise = undefined;
    throw error;
  });
  return dbPromise;
};

const readFromDb = async (ids: string[]) => {
  const db = await openDb();
  const store = db.transaction(STORE, "readonly").objectStore(STORE);
  const rows = await Promise.all(
    ids.map((id) => requestToPromise<TrackInfo | undefined>(store.get(id))),
  );
  return rows.filter((row): row is TrackInfo => row !== undefined);
};

const writeToDb = async (infos: TrackInfo[]) => {
  if (infos.length === 0) return;
  const db = await openDb();
  const transaction = db.transaction(STORE, "readwrite");
  const store = transaction.objectStore(STORE);
  for (const info of infos) store.put(info);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
};

const authHeaders = () => ({
  Authorization: `Bearer ${Spicetify.Platform.AuthorizationAPI.getState().token.accessToken}`,
  "Spotify-App-Version": Spicetify.Platform.version,
  "App-Platform": Spicetify.Platform.PlatformData.app_platform,
  Accept: "application/json",
});

const toTrackInfo = (
  features: AudioFeatures,
  id: string,
  fetchedAt: number,
): TrackInfo | undefined => {
  if (typeof features?.tempo !== "number") return undefined;
  return {
    id,
    tempo: features.tempo,
    key: features.key,
    mode: features.mode,
    timeSignature: features.time_signature,
    danceability: features.danceability,
    energy: features.energy,
    loudness: features.loudness,
    valence: features.valence,
    fetchedAt,
  };
};

const fetchBatch = async (ids: string[]) => {
  const response = await fetch(`${AUDIO_FEATURES_URL}?ids=${ids.join(",")}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Audio features request failed with ${response.status}`);
  }
  const body = (await response.json()) as { audio_features?: AudioFeatures[] };
  const fetchedAt = Date.now();

  // Results are positional; missing tracks come back as null.
  return ids.map((id, i) =>
    toTrackInfo(body.audio_features?.[i] ?? null, id, fetchedAt),
  );
};

const loadMissing = async (ids: string[]) => {
  const found = new Map<string, TrackInfo>();

  try {
    for (const info of await readFromDb(ids)) found.set(info.id, info);
  } catch (error) {
    console.error("spicetify-dj: failed to read track cache", error);
  }

  const toFetch = ids.filter((id) => !found.has(id));
  const fetched: TrackInfo[] = [];

  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const chunk = toFetch.slice(i, i + BATCH_SIZE);
    try {
      const infos = await fetchBatch(chunk);
      chunk.forEach((id, j) => {
        const info = infos[j];
        if (info) {
          found.set(id, info);
          fetched.push(info);
        } else {
          unavailable.add(id);
        }
      });
    } catch (error) {
      console.error("spicetify-dj: failed to fetch audio features", error);
    }
  }

  for (const [id, info] of found) cache.set(id, info);
  await writeToDb(fetched).catch((error) =>
    console.error("spicetify-dj: failed to write track cache", error),
  );

  return found;
};

/** Returns the Spotify track id for a `spotify:track:` URI, otherwise undefined. */
export const getTrackId = (uri: string) => {
  const [scheme, type, id] = uri.split(":");
  return scheme === "spotify" && type === "track" && id && TRACK_ID.test(id)
    ? id
    : undefined;
};

export const getCachedTrackInfo = (id: string | undefined) =>
  id ? cache.get(id) : undefined;

/**
 * Resolves track info from memory, then IndexedDB, then batched Spotify requests.
 * Concurrent calls for the same ids share one lookup.
 */
export const getTrackInfos = async (ids: Iterable<string>) => {
  const requested = Array.from(new Set(ids)).filter((id) => TRACK_ID.test(id));
  const toLoad = requested.filter(
    (id) => !cache.has(id) && !unavailable.has(id) && !pending.has(id),
  );

  if (toLoad.length > 0) {
    const batch = loadMissing(toLoad);
    for (const id of toLoad) {
      const promise = batch
        .then((found) => found.get(id))
        .finally(() => pending.delete(id));
      pending.set(id, promise);
    }
  }

  const result = new Map<string, TrackInfo>();
  await Promise.all(
    requested.map(async (id) => {
      const info = cache.get(id) ?? (await pending.get(id));
      if (info) result.set(id, info);
    }),
  );
  return result;
};
