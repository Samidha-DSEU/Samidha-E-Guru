"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
  gradientWords?: string[]; // Words to apply gradient styling
  highlightWords?: string[]; // Words to apply glowing highlight styling
  as?: "h1" | "h2" | "p" | "div";
  staggerMs?: number;
  delayOffsetMs?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = "",
  wordClassName = "",
  gradientWords = [],
  highlightWords = [],
  as: Component = "h1",
  staggerMs = 30,
  delayOffsetMs = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLHeadingElement | HTMLParagraphElement | HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const words = text.split(" ");

  return (
    <Component ref={ref as any} className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${className}`}>
      {words.map((word, idx) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9%&]/g, "");
        const isGradient = gradientWords.some((gw) =>
          cleanWord.toLowerCase().includes(gw.toLowerCase())
        );
        const isHighlight = highlightWords.some((hw) =>
          cleanWord.toLowerCase().includes(hw.toLowerCase())
        );

        return (
          <span
            key={idx}
            style={{
              transitionDuration: "550ms",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: `${isVisible ? delayOffsetMs + idx * staggerMs : 0}ms`,
            }}
            className={`inline-block transition-all transform-gpu ${
              isVisible
                ? "opacity-100 translate-y-0 rotate-0 scale-100 blur-0"
                : "opacity-0 translate-y-6 -rotate-1 scale-95 blur-[2px]"
            } ${
              isGradient
                ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-sm font-extrabold"
                : isHighlight
                ? "text-sky-600 dark:text-sky-400 font-semibold underline decoration-sky-500/40 decoration-2 underline-offset-4"
                : ""
            } ${wordClassName}`}
          >
            {word}
          </span>
        );
      })}
    </Component>
  );
};
