"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
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
  once = true, // Default true: reveal once to avoid scroll jank!
  onClick,
  style = {},
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px 50px 0px",
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
          return "opacity-0 translate-y-6 scale-[0.98]";
        case "down":
          return "opacity-0 -translate-y-6 scale-[0.98]";
        case "left":
          return "opacity-0 -translate-x-6 scale-[0.98]";
        case "right":
          return "opacity-0 translate-x-6 scale-[0.98]";
        case "zoom":
          return "opacity-0 scale-95";
        default:
          return "opacity-0 translate-y-6";
      }
    }
    return "opacity-100 translate-y-0 translate-x-0 scale-100";
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        transitionDuration: "450ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${isVisible ? delay : 0}ms`,
        ...style,
      }}
      className={`transition-[transform,opacity] transform-gpu will-change-transform ${getDirectionStyles()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
