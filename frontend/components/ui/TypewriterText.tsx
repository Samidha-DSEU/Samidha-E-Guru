"use client";

import React, { useEffect, useRef, useState } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  speedMs?: number; // Speed per character in ms (e.g. 18ms)
  highlightWords?: string[];
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  className = "",
  speedMs = 18,
  highlightWords = [],
}) => {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.02, // Trigger immediately on mobile
        rootMargin: "0px 0px 40px 0px",
      }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  // Typewriter character timer
  useEffect(() => {
    if (!isVisible) {
      setDisplayedLength(0);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      current++;
      setDisplayedLength(current);
      if (current >= text.length) {
        clearInterval(interval);
      }
    }, speedMs);

    return () => clearInterval(interval);
  }, [isVisible, text, speedMs]);

  const currentText = text.slice(0, displayedLength);
  const words = currentText.split(" ");
  const isFinished = displayedLength >= text.length;

  return (
    <p ref={ref} className={`leading-relaxed ${className}`}>
      {words.map((word, idx) => {
        const cleanWord = word.replace(/[^a-zA-Z0-9%&]/g, "");
        const isHighlight = highlightWords.some((hw) =>
          cleanWord.toLowerCase().includes(hw.toLowerCase())
        );

        return (
          <React.Fragment key={idx}>
            <span
              className={
                isHighlight
                  ? "text-sky-600 dark:text-sky-400 font-semibold underline decoration-sky-500/50 underline-offset-4"
                  : ""
              }
            >
              {word}
            </span>
            {idx < words.length - 1 && " "}
          </React.Fragment>
        );
      })}

      {/* Blinking Typewriter Cursor */}
      <span
        className={`inline-block w-2 h-4 sm:h-5 ml-1 bg-sky-500 rounded-sm align-middle shadow-lg shadow-sky-500/50 ${
          isFinished ? "animate-pulse" : "animate-ping"
        }`}
      />
    </p>
  );
};
