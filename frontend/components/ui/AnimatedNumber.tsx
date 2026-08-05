"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: string; // e.g. "10,000+" or "500+" or "100%"
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState("0");
  const ref = useRef<HTMLDivElement | null>(null);

  // Extract raw numeric number and suffix
  const match = value.match(/([\d,]+)(.*)/);
  const targetNum = match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
  const suffix = match ? match[2] : "";

  useEffect(() => {
    let animationFrameId: number;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const duration = 1500; // 1.5s duration
          const startTime = performance.now();

          const updateNumber = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeProgress * targetNum);

            setDisplayValue(current.toLocaleString() + suffix);

            if (progress < 1) {
              animationFrameId = requestAnimationFrame(updateNumber);
            }
          };

          animationFrameId = requestAnimationFrame(updateNumber);
        } else {
          setDisplayValue("0" + suffix);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
      cancelAnimationFrame(animationFrameId);
    };
  }, [targetNum, suffix]);

  return (
    <div ref={ref} className={className}>
      {displayValue}
    </div>
  );
};
