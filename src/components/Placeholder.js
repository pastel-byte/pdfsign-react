// MouseFollower.js

import React, { useState, useEffect } from "react";

const Placeholder = ({ canvasArea }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (canvasArea) {
      const rect = canvasArea;
      if (
        e.pageX >= rect.left &&
        e.pageX <= rect.right &&
        e.pageY >= rect.top &&
        e.pageY <= rect.bottom
      ) {
        setPosition({ x: e.pageX - 5, y: e.pageY });
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        width: process.env.REACT_APP_SIGN_CANVAS_WIDTH + "px",
        height: process.env.REACT_APP_SIGN_CANVAS_HEIGHT + "px",
        backgroundColor: "#FABB3462",
        left: position.x + "px",
        top: position.y + "px",
        zIndex: 1000,
        pointerEvents: "none",
        border: "dashed 1px #FABB34",
        borderRadius: "5px",
      }}
    ></div>
  );
};

export default Placeholder;
