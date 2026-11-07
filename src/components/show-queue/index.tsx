import "./show-queue.scss";
import { useState } from "react";
import { Button } from "../button/button";
import { useDjSession } from "../dj-session/hooks";
import { withTrackKeys } from "../dj-session/session-state";

const millisToDuration = (millis: number | string) => {
  const totalSeconds =
    typeof millis === "number"
      ? millis / 1000
      : Number.parseInt(millis, 10) / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${hours ? `${hours}:${minutes.toString().padStart(2, "0")}` : minutes}:${seconds}`;
};

type RootlistItem = {
  type: string;
  name?: string;
  uri: string;
  items?: RootlistItem[];
};

// Rootlist positions: `{ after: { uri: folderUri } }` places an item at the top inside that folder.
const insideFolder = (folderUri?: string) =>
  folderUri ? { after: { uri: folderUri } } : { before: "start" };

const ensureFolderPath = async (path: string[]) => {
  const rootlist = Spicetify.Platform.RootlistAPI;
  let parent: RootlistItem = await rootlist.getContents();
  let parentUri: string | undefined;

  for (const name of path) {
    const existing = parent.items?.find(
      (item) => item.type === "folder" && item.name === name,
    );
    if (existing) {
      parent = existing;
    } else {
      const { uri } = await rootlist.createFolder(
        name,
        insideFolder(parentUri),
      );
      if (!uri) throw new Error(`Failed to create folder "${name}"`);
      parent = { type: "folder", name, uri, items: [] };
    }
    parentUri = parent.uri;
  }

  return parentUri;
};

const toLocalDate = (date: Date) =>
  [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");

// e.g. "2027-11-07|19:00-21:00| - Name" or "2027-11-07 - Name"
const formatPlaylistName = (
  date: Date,
  name: string,
  start: string,
  end: string,
) => {
  const times = start || end ? `|${start}-${end}|` : "";
  const title = name.trim();
  return `${toLocalDate(date)}${times}${title ? ` - ${title}` : ""}`;
};

// Accepts "19:00", "1900", "19" or "9:5"; returns "HH:MM", "" for empty, or undefined if invalid.
const normalizeTime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match =
    /^(\d{1,2}):(\d{1,2})$/.exec(trimmed) ??
    /^(\d{1,2})(\d{2})?$/.exec(
      trimmed.replace(/\D/g, "") === trimmed ? trimmed : "",
    );
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  if (hours > 23 || minutes > 59) return undefined;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

const TimeInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <input
    type="text"
    inputMode="numeric"
    placeholder="HH:MM"
    maxLength={5}
    aria-label={label}
    aria-invalid={normalizeTime(value) === undefined}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onBlur={() => onChange(normalizeTime(value) ?? value)}
  />
);

export const SessionInfo = () => {
  const { queueHistory, playedTracks, queue, startTime, startSession, timer } =
    useDjSession();
  const songs = [...queueHistory, ...queue];
  const length = songs.length;
  const {
    duration,
    bpm,
    lowestBpm,
    highestBpm,
    lowestDuration,
    longestDuration,
  } = songs.reduce(
    (acc, t) => {
      const duration = Number.parseInt(t?.duration ?? "0", 10);
      const bpm = t.tempo;
      return {
        duration: acc.duration + duration,
        bpm: acc.bpm + (bpm ?? 0),
        lowestBpm: bpm ? Math.min(acc.lowestBpm ?? bpm, bpm) : acc.lowestBpm,
        highestBpm: bpm ? Math.max(acc.highestBpm ?? bpm, bpm) : acc.highestBpm,
        lowestDuration: Math.min(acc.lowestDuration, duration),
        longestDuration: Math.max(acc.longestDuration, duration),
      };
    },
    {
      duration: 0,
      bpm: 0,
      lowestBpm: 999,
      highestBpm: 0,
      lowestDuration: Number.MAX_SAFE_INTEGER,
      longestDuration: 0,
    },
  );

  const averageDuration = millisToDuration(duration / length);
  const lowestDurationFormatted = millisToDuration(lowestDuration);
  const longestDurationFormatted = millisToDuration(longestDuration);
  const averageBpm = Math.floor(bpm / length);

  const stats = {
    averageBpm: `BPM: ${averageBpm}`,
    averageDuration: `Duration: ${averageDuration}`,
    rangeBpm: `BPM: ${lowestBpm > 0 ? Math.round(lowestBpm) : "N/A"} / ${highestBpm < 999 ? Math.round(highestBpm) : "N/A"}`,
    rangeDuration: `Duration: ${lowestDurationFormatted} / ${longestDurationFormatted}`,
  };
  // Spotify descriptions are single-line.
  const playlistDescription = `Averages: ${stats.averageBpm}, ${stats.averageDuration} | Min/max: ${stats.rangeBpm}, ${stats.rangeDuration}`;

  const sessionDuration =
    timer && startTime
      ? millisToDuration(timer.getTime() - startTime.getTime())
      : 0;

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");

  const handleCreatePlaylist = async () => {
    const historyUris = playedTracks.map((track) => track.uri);
    if (historyUris.length === 0) {
      Spicetify.showNotification(
        "No tracks in session history to add to playlist",
      );
      return;
    }

    const start = normalizeTime(sessionStart);
    const end = normalizeTime(sessionEnd);
    if (start === undefined || end === undefined) {
      Spicetify.showNotification("Times must be in 24h HH:MM format", true);
      return;
    }

    const playlistName = formatPlaylistName(
      startTime ?? new Date(),
      newPlaylistName,
      start,
      end,
    );
    Spicetify.showNotification(`Creating playlist: ${playlistName}`);

    let folderUri: string | undefined;
    try {
      folderUri = await ensureFolderPath([
        "DJ sessions",
        new Date().getFullYear().toString(),
      ]);
    } catch (error) {
      console.error("spicetify-dj: failed to resolve session folder", error);
    }

    const playlistRes = await Spicetify.Platform.RootlistAPI.createPlaylist(
      playlistName,
      insideFolder(folderUri),
    );

    if (!playlistRes) return;

    const playlistUri =
      typeof playlistRes === "string" ? playlistRes : playlistRes?.uri;

    await Spicetify.Platform.PlaylistAPI.add(playlistUri, historyUris, {
      after: "end",
    });

    try {
      await Spicetify.Platform.PlaylistAPI.updateDetails(playlistUri, {
        description: playlistDescription,
      });
    } catch (error) {
      console.error("spicetify-dj: failed to set playlist description", error);
    }
  };

  return (
    <div className="show-queue-container">
      <div className="song-queue-list">
        <h3>Current</h3>
        <div>
          {withTrackKeys(queue).map(({ renderKey, artist_name, title }, i) => {
            const isCurrentyPlaying = i === 0;

            return (
              <div
                key={`queue-${renderKey}`}
                className={`song-row ${isCurrentyPlaying ? "current" : ""}`}
              >
                <p>{artist_name}</p>
                <p>{title}</p>
              </div>
            );
          })}
        </div>
        <h3>History</h3>
        <div>
          {withTrackKeys(queueHistory).map(
            ({ renderKey, artist_name, title }) => (
              <div key={`history-${renderKey}`} className="song-row">
                <p>{artist_name}</p>
                <p>{title}</p>
              </div>
            ),
          )}
        </div>
      </div>

      {/* <div>
        <h2>Session duration</h2>
        <Button type="button" onClick={startSession}>
          Start session
        </Button>
        <p>{`Start ${startTime?.toLocaleTimeString() ?? "N/A"}`}</p>
        <p>{`Duration ${sessionDuration}`}</p>
      </div> */}
      <div className="create-playlist">
        <h2>Session playlist</h2>
        <div>
          <label>Start and end time</label>
          <div className="start-and-end-time">
            <TimeInput
              label="Start time"
              value={sessionStart}
              onChange={setSessionStart}
            />
            <TimeInput
              label="End time"
              value={sessionEnd}
              onChange={setSessionEnd}
            />
          </div>
        </div>
        <input
          type="text"
          placeholder="Playlist name"
          defaultValue={newPlaylistName}
          className="input-tekst"
          onChange={async (e) => {
            const v = e.target.value;
            await setNewPlaylistName(v);
          }}
        />
        <Button type="button" onClick={handleCreatePlaylist}>
          Create
        </Button>
      </div>
      <div>
        <h2>Averages</h2>
        <p>{stats.averageBpm}</p>
        <p>{stats.averageDuration}</p>
        <h2>Min/max</h2>
        <p>{stats.rangeBpm}</p>
        <p>{stats.rangeDuration}</p>
      </div>
    </div>
  );
};
