import type { TrackRow } from "@/types/spicetify-dj";

export type SessionState = {
  current?: TrackRow;
  queue: TrackRow[];
  history: TrackRow[];
};

export const isSameTrack = (previous: TrackRow, next: TrackRow) =>
  previous.uri === next.uri &&
  (!previous.uid || !next.uid || previous.uid === next.uid);

export const updateSession = (
  state: SessionState,
  tracks: TrackRow[],
  blockCurrent = false,
): SessionState => {
  const [next] = tracks;
  const current = blockCurrent ? undefined : next;
  return {
    current,
    history:
      state.current && (!current || !isSameTrack(state.current, current))
        ? [...state.history, state.current]
        : state.history,
    queue: blockCurrent ? tracks.slice(1) : tracks,
  };
};

export const getPlayedTracks = (state: SessionState) =>
  state.current ? [...state.history, state.current] : state.history;

export const withTrackKeys = (tracks: TrackRow[]) => {
  const occurrences = new Map<string, number>();
  return tracks.map((track) => {
    const identity = track.uid ?? track.uri;
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    return { ...track, renderKey: `${identity}:${occurrence}` };
  });
};
