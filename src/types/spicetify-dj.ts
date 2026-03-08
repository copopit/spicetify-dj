export type TrackRow = {
  uid: string | undefined;
  uri: string;
  artist_name?: string;
  title?: string;
  duration?: string;
  tempo?: number;
  diff?: number;
};
