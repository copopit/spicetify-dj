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

  const duration = millisToDuration(
    [...queueHistory, ...queue].reduce((acc, t) => {
      const duration = Number.parseInt(t?.duration ?? "0", 10);
      return acc + duration;
    }, 0) /
      (queueHistory.length + queue.length),
  );

  return (
    <div className="show-queue-container">
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
      <div>
        <h2>Average duration</h2>
        <p>{`${duration}`}</p>
      </div>
    </div>
  );
};
