import { useEffect, useRef, useState } from "react";
import "./container.scss";

export const Container = ({ children }: { children: React.ReactNode }) => {
  const [size, setSize] = useState({
    height: 300,
  });
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragHandleRef.current && containerRef.current) {
        const newHeight = e.clientY - containerRef.current.offsetTop;
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        resizeTimeout = setTimeout(() => {
          setSize({ height: newHeight < 60 ? 6 : newHeight });
        }, 1);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };

    const handleMouseDown = () => {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    };

    const dragHandle = dragHandleRef.current;
    if (dragHandle) {
      dragHandle.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      if (dragHandle) {
        dragHandle.removeEventListener("mousedown", handleMouseDown);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="container"
      style={{
        height: size.height,
        overflowY: size.height < 60 ? "hidden" : "visible",
      }}
    >
      <div className="content-wrapper">{children}</div>
      <div ref={dragHandleRef} className="drag-handle" />
    </div>
  );
};
