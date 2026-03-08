import { useContext } from "react";
import { DjSessionContext } from ".";

export const useDjSession = () => {
  const ctx = useContext(DjSessionContext);
  if (!ctx) {
    throw new Error("useDjSession must be used within a DjSessionProvider");
  }
  return ctx;
};
