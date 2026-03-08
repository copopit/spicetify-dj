import { type ReactNode, useEffect, useState } from "react";
import { Toggle } from "../toggle";
import "./tabs.scss";
import { useDjSession } from "../dj-session/hooks";

export const Tabs = ({
  tabs,
}: {
  tabs: { title: string; component: ReactNode }[];
}) => {
  const { autoPauseQueueContext, setAutoPauseQueueContext } = useDjSession();
  const [activeTab, setActiveTab] = useState(0);

  const [collapse, setCollapse] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setCollapse(window.innerWidth < 100);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map(({ title }, i) => (
          <button
            key={title}
            type="button"
            className={`tab-button${activeTab === i ? " tab-button-active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {title}
          </button>
        ))}
        <div className="toggle-settings">
          <p>Auto-pause context</p>
          <Toggle
            onClick={() => setAutoPauseQueueContext((p) => !p)}
            state={autoPauseQueueContext}
          />
        </div>
      </div>
      <div className="tabs-content">{tabs[activeTab].component}</div>
    </div>
  );
};
