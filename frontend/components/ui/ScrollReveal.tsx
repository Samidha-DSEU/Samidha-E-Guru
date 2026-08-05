"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // delay in ms (e.g. 100, 200, 300)
  direction?: "up" | "down" | "left" | "right" | "zoom";
  once?: boolean; // Set false for continuous bi-directional scroll animation (up & down)
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  once = false, // Default false: bi-directional continuous scroll animations!
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && once && ref.current) {
          observer.unobserve(ref.current);
        }
      },
      {
        threshold: 0.12, // Trigger when 12% is in view
        rootMargin: "0px 0px -30px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [once]);

  const getDirectionStyles = () => {
    if (!isVisible) {
      switch (direction) {
        case "up":
          return "opacity-0 translate-y-14 scale-[0.96]";
        case "down":
          return "opacity-0 -translate-y-14 scale-[0.96]";
        case "left":
          return "opacity-0 -translate-x-14 scale-[0.96]";
        case "right":
          return "opacity-0 translate-x-14 scale-[0.96]";
        case "zoom":
          return "opacity-0 scale-85";
        default:
          return "opacity-0 translate-y-14";
      }
    }
    return "opacity-100 translate-y-0 translate-x-0 scale-100";
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: "750ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${isVisible ? delay : 0}ms`,
      }}
      className={`transition-all transform-gpu will-change-transform ${getDirectionStyles()} ${className}`}
    >
      {children}
    </div>
  );
};
