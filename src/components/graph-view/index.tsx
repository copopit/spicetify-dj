import type { TrackRow } from "@/types/spicetify-dj";
import { useDjSession } from "../dj-session/hooks";
import "./graph-view.scss";
import { useState } from "react";
import { Popover } from "react-tiny-popover";

const addTempoDiff = (list: TrackRow[]): (TrackRow & { diff?: number })[] => {
  let prevTempo: number | undefined;
  return list.map((item) => {
    const newValues = { ...item };
    if (prevTempo !== undefined) {
      const correctedTempoItem = item.tempo
        ? item.tempo > 160
          ? item.tempo / 2
          : item.tempo
        : 0;
      const correctedTempoPrev = prevTempo > 160 ? prevTempo / 2 : prevTempo;
      newValues.diff = item.tempo
        ? Math.abs(correctedTempoItem - correctedTempoPrev)
        : undefined;
    }
    prevTempo = item.tempo;
    return newValues;
  });
};

const getDiffColor = (diff: number | undefined) => {
  if (diff === undefined) return "hsl(0, 0%, 50%)";

  const maxDiff = 10;
  const normalized = Math.min(Math.max(diff / maxDiff, 0), 1);
  const hue = 120 - normalized * 120;

  return `hsl(${hue} 75% 50%)`;
};

export const GraphView = () => {
  const { queue: q, queueHistory: qh } = useDjSession();
  const queue = addTempoDiff(q);
  const queueHistory = addTempoDiff(qh);

  const min = 73;
  const max = 115;

  const rootDiv = document.querySelector("div.Root__main-view");

  return (
    <div
      className="graph-container"
      style={{ width: rootDiv?.clientWidth ?? "100%" }}
    >
      <h2>Graph view</h2>
      <div className="diagram">
        <div>
          <p>{max}</p>
          <p>{min}</p>
        </div>
        <div className="bpm-view">
          {queueHistory.map((item) => (
            <Cylinder key={item.uri} {...item} min={min} max={max} />
          ))}
          {queueHistory.length > 0 && <div className="separator" />}
          {queue.map((item) => (
            <Cylinder key={item.uri} {...item} min={min} max={max} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Cylinder = ({
  uri,
  title,
  tempo,
  diff,
  min,
  max,
}: TrackRow & { diff?: number } & { min: number; max: number }) => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <Popover
      key={uri}
      isOpen={showPopover}
      positions={["top"]}
      content={<div className="popover-text">{title}</div>}
    >
      <button
        type="button"
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className="bpm-row"
        style={{
          height: tempo
            ? `${Math.min(((tempo > 160 ? tempo / 2 : tempo) - min) / (max - min), 1) * 100}%`
            : "5%",
          backgroundColor: getDiffColor(diff),
        }}
      >
        <p>{tempo}</p>
      </button>
    </Popover>
  );
};
