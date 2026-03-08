import type { HTMLProps } from "react";
import "./toggle.scss";

export const Toggle = ({
  onClick,
  state,
}: HTMLProps<HTMLButtonElement> & { state: boolean }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`toggle-btn ${state ? "toggle-btn-end" : "toggle-btn-start"}`}
    >
      <div />
    </button>
  );
};
