// MouseFollower.js

import React, { useState, useEffect } from "react";
import axios from "axios";

const MouseFollower = ({ canvasArea }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imgSrc, setImgSrc] = useState(null);
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

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-signature-image`,
          { responseType: "blob" }
        );
        const blob = new Blob([response.data], { type: "image/png" });
        const objectUrl = URL.createObjectURL(blob);
        setImgSrc(objectUrl);
      } catch (error) {
        console.error(error);
      }
    };

    fetchImage();
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left: position.x + "px",
        top: position.y + "px",
        zIndex: 1000,
        pointerEvents: "none",
        backgroundColor: "transparent", // Add this line
      }}
    >
      {/* ORIGINAL IMAGE IS 480 X 220 */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt="Signature"
          width={process.env.REACT_APP_SIGN_CANVAS_WIDTH}
          height={process.env.REACT_APP_SIGN_CANVAS_HEIGHT}
        />
      )}
    </div>
  );
};

export default MouseFollower;
