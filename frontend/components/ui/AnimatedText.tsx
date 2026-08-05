"use client";

import React, { useEffect, useRef, useState } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
  gradientWords?: string[]; // Words to apply gradient styling
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = "",
  wordClassName = "",
  gradientWords = [],
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const words = text.split(" ");

  return (
    <h1 ref={ref} className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, idx) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9&]/g, "");
        const isGradient = gradientWords.some((gw) =>
          cleanWord.toLowerCase().includes(gw.toLowerCase())
        );

        return (
          <span
            key={idx}
            style={{
              transitionDuration: "600ms",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: `${isVisible ? idx * 45 : 0}ms`,
            }}
            className={`inline-block transition-all transform-gpu ${
              isVisible
                ? "opacity-100 translate-y-0 rotate-0 scale-100"
                : "opacity-0 translate-y-8 -rotate-2 scale-90"
            } ${
              isGradient
                ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-sm font-extrabold"
                : ""
            } ${wordClassName}`}
          >
            {word}
          </span>
        );
      })}
    </h1>
  );
};
