"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // delay in ms (e.g. 100, 200, 300)
  direction?: "up" | "down" | "left" | "right" | "zoom";
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once revealed, unobserve for performance
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        threshold: 0.15, // Trigger when 15% of element is in viewport
        rootMargin: "0px 0px -40px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const getDirectionStyles = () => {
    if (!isVisible) {
      switch (direction) {
        case "up":
          return "opacity-0 translate-y-12 scale-[0.97]";
        case "down":
          return "opacity-0 -translate-y-12 scale-[0.97]";
        case "left":
          return "opacity-0 -translate-x-12";
        case "right":
          return "opacity-0 translate-x-12";
        case "zoom":
          return "opacity-0 scale-90";
        default:
          return "opacity-0 translate-y-12";
      }
    }
    return "opacity-100 translate-y-0 translate-x-0 scale-100";
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: "800ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all transform-gpu will-change-transform ${getDirectionStyles()} ${className}`}
    >
      {children}
    </div>
  );
};
