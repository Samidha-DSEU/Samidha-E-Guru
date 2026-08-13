"use client";

import React, { useRef } from "react";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // Max tilt angle in deg (default 8)
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = "",
  maxTilt = 6,
  onClick,
  style = {},
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const shineRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !innerRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    const shineX = (x / rect.width) * 100;
    const shineY = (y / rect.height) * 100;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (innerRef.current) {
        innerRef.current.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
        innerRef.current.style.transition = "transform 80ms ease-out";
      }
      if (shineRef.current) {
        shineRef.current.style.background = `radial-gradient(circle at ${shineX.toFixed(1)}% ${shineY.toFixed(1)}%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)`;
        shineRef.current.style.opacity = "1";
      }
    });
  };

  const handleMouseEnter = () => {
    if (shineRef.current) shineRef.current.style.opacity = "1";
  };

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (innerRef.current) {
      innerRef.current.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      innerRef.current.style.transition = "transform 400ms ease-in-out";
    }
    if (shineRef.current) {
      shineRef.current.style.opacity = "0";
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
        ...style,
      }}
      className={`group relative ${onClick ? "cursor-pointer" : ""} ${className}`}
      {...props}
    >
      <div
        ref={innerRef}
        className="relative overflow-hidden transform-gpu will-change-transform h-full w-full"
      >
        <div
          ref={shineRef}
          className="absolute inset-0 pointer-events-none z-10 opacity-0 transition-opacity duration-300"
        />
        {children}
      </div>
    </div>
  );
};
