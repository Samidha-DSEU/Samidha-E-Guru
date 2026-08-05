"use client";

import React, { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  baseSize: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  vx: number;
  vy: number;
}

export const CursorDotsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    let dots: Dot[] = [];
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 140, // Proximity activation radius in pixels
      active: false,
    };

    // Responsive dot density calculation
    const getSpacing = (w: number) => {
      if (w < 640) return 45; // Mobile: lower density for performance
      if (w < 1024) return 38; // Tablet
      return 32; // Desktop
    };

    const initCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Re-populate dot grid
      dots = [];
      const spacing = getSpacing(width);
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;

          // Subtle theme palette: Sky blue, Indigo, and Soft Violet
          const colors = [
            "14, 165, 233", // sky-500
            "99, 102, 241", // indigo-500
            "168, 85, 247", // purple-500
          ];
          const color = colors[(i + j) % colors.length];
          const baseAlpha = Math.random() * 0.25 + 0.15; // 0.15 - 0.40 opacity
          const baseSize = Math.random() * 0.8 + 1.2; // 1.2px - 2.0px radius

          dots.push({
            x,
            y,
            baseX: x,
            baseY: y,
            size: baseSize,
            baseSize,
            color,
            alpha: baseAlpha,
            baseAlpha,
            vx: 0,
            vy: 0,
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
        mouse.active = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render & update dots
      const activeDotsNearCursor: Dot[] = [];

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (mouse.active && dist < mouse.radius) {
          // Magnetic displacement away from cursor
          const angle = Math.atan2(dy, dx);
          const force = (mouse.radius - dist) / mouse.radius;
          const pushX = Math.cos(angle) * force * 15;
          const pushY = Math.sin(angle) * force * 15;

          dot.x += (dot.baseX - pushX - dot.x) * 0.15;
          dot.y += (dot.baseY - pushY - dot.y) * 0.15;

          // Expand size and brighten alpha
          dot.size += (dot.baseSize + force * 2.5 - dot.size) * 0.2;
          dot.alpha += (0.85 - dot.alpha) * 0.2;

          activeDotsNearCursor.push(dot);
        } else {
          // Smooth return to base position & original state
          dot.x += (dot.baseX - dot.x) * 0.08;
          dot.y += (dot.baseY - dot.y) * 0.08;
          dot.size += (dot.baseSize - dot.size) * 0.08;
          dot.alpha += (dot.baseAlpha - dot.alpha) * 0.08;
        }

        // Draw dot circle
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dot.color}, ${dot.alpha})`;
        ctx.fill();
      }

      // Draw faint constellation lines between neighboring active dots
      for (let i = 0; i < activeDotsNearCursor.length; i++) {
        for (let j = i + 1; j < activeDotsNearCursor.length; j++) {
          const d1 = activeDotsNearCursor[i];
          const d2 = activeDotsNearCursor[j];

          const lineDx = d1.x - d2.x;
          const lineDy = d1.y - d2.y;
          const lineDist = Math.sqrt(lineDx * lineDx + lineDy * lineDy);

          if (lineDist < 60) {
            const lineAlpha = (1 - lineDist / 60) * 0.25;
            ctx.beginPath();
            ctx.moveTo(d1.x, d1.y);
            ctx.lineTo(d2.x, d2.y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    initCanvas();

    window.addEventListener("resize", initCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", initCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full -z-10 transition-opacity duration-500"
    />
  );
};
