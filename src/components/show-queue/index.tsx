import "./show-queue.scss";
import { useState } from "react";
import { useDjSession } from "../dj-session/hooks";

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

export const Test = () => {
  const { queueHistory, queue, startTime, timer } = useDjSession();
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

  const sessionDuration = millisToDuration(
    timer.getTime() - startTime.getTime(),
  );

  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleCreatePlaylist = async () => {
    Spicetify.showNotification(`Creating playlist: ${newPlaylistName}`);

    const rootlistContent = await Spicetify.Platform.RootlistAPI.getContents();
    let folder = null;

    const djSessionFolder = rootlistContent.folders.find(
      (f) => f.name === "DJ sessions",
    );

    if (djSessionFolder) {
      const currentYear = new Date().getFullYear();
      folder =
        djSessionFolder.items.find((f) => f.name === currentYear.toString()) ??
        (await Spicetify.Platform.RootlistAPI.createFolder(
          currentYear.toString(),
          djSessionFolder.uri,
        ));
    }

    const playlistRes = await Spicetify.Platform.RootlistAPI.createPlaylist(
      newPlaylistName.trim() ? newPlaylistName : startTime.toISOString(),
      {
        before: "start",
      },
    );

    if (!playlistRes) return;

    const playlistUri =
      typeof playlistRes === "string" ? playlistRes : playlistRes?.uri;

    const historyUris = queueHistory.map((t) => t.uri);
    if (historyUris.length === 0) return;

    await Spicetify.Platform.PlaylistAPI.add(playlistUri, historyUris, {
      after: "end",
    });
  };

  return (
    <div className="show-queue-container">
      <div>
        <div>
          <h2>Previous tracks</h2>
          {queueHistory.map(({ uri, artist_name, title }) => (
            <div key={uri} className="song-row">
              {/* <p>{uri}</p> */}
              <p>{artist_name}</p>
              <p>{title}</p>
            </div>
          ))}
        </div>
        <div>
          <h2>Current tracks</h2>
          {queue.map(({ uri, artist_name, title }) => (
            <div key={uri} className="song-row">
              {/* <p>{uri}</p> */}
              <p>{artist_name}</p>
              <p>{title}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2>Session duration</h2>
        <p>{`Start ${startTime.toLocaleTimeString()}`}</p>
        {/* <p>{`Duration ${timer.getHours() ?? ""}:${timer.getMinutes() ?? ""}:${timer.getSeconds() ?? ""}`}</p> */}
        <p>{`Duration ${sessionDuration}`}</p>
      </div>
      <div>
        <h2>Create playlist from session</h2>
        <input
          type="text"
          placeholder="Playlist name"
          defaultValue={newPlaylistName}
          onChange={async (e) => {
            const v = e.target.value;
            await setNewPlaylistName(v);
          }}
        />
        <button type="button" onClick={handleCreatePlaylist}>
          Create
        </button>
      </div>
      <div>
        <h2>Averages</h2>
        <p>{`BPM: ${averageBpm}`}</p>
        <p>{`Duration: ${averageDuration}`}</p>
        <h2>Min/max</h2>
        <p>{`BPM: ${lowestBpm ?? "N/A"} / ${highestBpm ?? "N/A"}`}</p>
        <p>{`Duration: ${lowestDurationFormatted} / ${longestDurationFormatted}`}</p>
      </div>
    </div>
  );
};
