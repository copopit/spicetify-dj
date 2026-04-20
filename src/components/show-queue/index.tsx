import "./show-queue.scss";
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
  const { queueHistory, queue } = useDjSession();
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
      const bpm = t.tempo ?? 0;
      return {
        duration: acc.duration + duration,
        bpm: acc.bpm + bpm,
        lowestBpm: Math.min(acc.lowestBpm, bpm),
        highestBpm: Math.max(acc.highestBpm, bpm),
        lowestDuration: Math.min(acc.lowestDuration, duration),
        longestDuration: Math.max(acc.longestDuration, duration),
      };
    },
    {
      duration: 0,
      bpm: 0,
      lowestBpm: Number.MAX_SAFE_INTEGER,
      highestBpm: 0,
      lowestDuration: Number.MAX_SAFE_INTEGER,
      longestDuration: 0,
    },
  );

  console.log({ duration, bpm, length });

  const averageDuration = millisToDuration(duration / length);
  const lowestDurationFormatted = millisToDuration(lowestDuration);
  const longestDurationFormatted = millisToDuration(longestDuration);
  const averageBpm = Math.floor(bpm / length);

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
        <h2>Averages</h2>
        <p>{`BPM: ${averageBpm}`}</p>
        <p>{`Duration: ${averageDuration}`}</p>
        <h2>Min/max</h2>
        <p>{`BPM: ${lowestBpm} / ${highestBpm}`}</p>
        <p>{`Duration: ${lowestDurationFormatted} / ${longestDurationFormatted}`}</p>
      </div>
    </div>
  );
};
