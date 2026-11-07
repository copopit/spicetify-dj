export type TrackInfo = {
  id: string;
  tempo: number;
  /** Note name, e.g. "G#". */
  key?: string;
  mode?: "major" | "minor";
  camelot?: string;
  fetchedAt: number;
};

type AudioAttributesV2 = {
  bpm?: number;
  key?: { key?: string; mode?: number; camelotKey?: { value?: string } };
} | null;

type MetadataExtensionsAPI = {
  fetch: (
    ...requests: [uri: string, ...kinds: number[]][]
  ) => Promise<Record<string, Record<number, unknown> | undefined>>;
};

type AudioFeatures = {
  tempo?: number;
  key?: number;
  mode?: number;
} | null;

const DB_NAME = "spicetify-dj";
// v2: records no longer store the full audio-features payload.
const DB_VERSION = 2;
const STORE = "tracks";
const BATCH_SIZE = 100;
// Spotify extension_kind enum value; see docs/bpm-sources.md.
const AUDIO_ATTRIBUTES_V2 = 222;
const PITCH_CLASSES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
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
      if (request.result.objectStoreNames.contains(STORE)) {
        request.result.deleteObjectStore(STORE);
      }
      request.result.createObjectStore(STORE, { keyPath: "id" });
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

const fromAudioAttributes = (
  attributes: AudioAttributesV2,
  id: string,
  fetchedAt: number,
): TrackInfo | undefined => {
  if (typeof attributes?.bpm !== "number") return undefined;
  const { key, mode, camelotKey } = attributes.key ?? {};
  return {
    id,
    tempo: attributes.bpm,
    key,
    mode: mode === 2 ? "major" : mode === 1 ? "minor" : undefined,
    camelot: camelotKey?.value,
    fetchedAt,
  };
};

const fetchFromClient = async (ids: string[]) => {
  const api = (
    Spicetify.Platform?.PlaylistAPI as
      | { _metadataExtensionsAPI?: MetadataExtensionsAPI }
      | undefined
  )?._metadataExtensionsAPI;
  if (typeof api?.fetch !== "function") {
    throw new Error("Metadata extensions API unavailable");
  }

  const uris = ids.map((id) => `spotify:track:${id}`);
  const result = await api.fetch(
    ...uris.map((uri): [string, number] => [uri, AUDIO_ATTRIBUTES_V2]),
  );
  const fetchedAt = Date.now();

  return ids.map((id, i) =>
    fromAudioAttributes(
      (result[uris[i]]?.[AUDIO_ATTRIBUTES_V2] ?? null) as AudioAttributesV2,
      id,
      fetchedAt,
    ),
  );
};

const fromAudioFeatures = (
  features: AudioFeatures,
  id: string,
  fetchedAt: number,
): TrackInfo | undefined => {
  if (typeof features?.tempo !== "number") return undefined;
  return {
    id,
    tempo: features.tempo,
    key: features.key === undefined ? undefined : PITCH_CLASSES[features.key],
    mode:
      features.mode === 1 ? "major" : features.mode === 0 ? "minor" : undefined,
    fetchedAt,
  };
};

const fetchFromAudioFeatures = async (ids: string[]) => {
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
    fromAudioFeatures(body.audio_features?.[i] ?? null, id, fetchedAt),
  );
};

const SOURCES = [
  { name: "metadata extensions", fetch: fetchFromClient },
  { name: "audio features", fetch: fetchFromAudioFeatures },
];

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
    let remaining = toFetch.slice(i, i + BATCH_SIZE);
    let lastFailed = false;

    for (const source of SOURCES) {
      if (remaining.length === 0) break;
      try {
        const infos = await source.fetch(remaining);
        lastFailed = false;
        for (const info of infos) {
          if (!info) continue;
          found.set(info.id, info);
          fetched.push(info);
        }
        remaining = remaining.filter((id) => !found.has(id));
      } catch (error) {
        lastFailed = true;
        console.warn(`spicetify-dj: ${source.name} lookup failed`, error);
      }
    }

    // Only give up on tracks the final source answered without data, so errors are retried.
    if (!lastFailed) for (const id of remaining) unavailable.add(id);
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
