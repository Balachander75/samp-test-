import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const TopProgressBar: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Immediate activation on route change
    setIsVisible(true);
    setProgress(25);

    const step1 = setTimeout(() => setProgress(65), 80);
    const step2 = setTimeout(() => setProgress(90), 180);
    const step3 = setTimeout(() => setProgress(100), 280);
    const cleanup = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 450);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(cleanup);
    };
  }, [location.pathname, location.search]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none transition-opacity duration-200"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div className="relative h-full w-full">
        {/* Main glowing progress track */}
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-700 transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
        {/* High-intensity glowing tip head */}
        {progress > 0 && progress < 100 && (
          <div
            className="absolute top-0 h-[2.5px] w-12 bg-white shadow-[0_0_12px_3px_rgba(99,102,241,0.9)] opacity-90 transition-all duration-200 ease-out"
            style={{ left: `calc(${progress}% - 48px)` }}
          />
        )}
      </div>
    </div>
  );
};
