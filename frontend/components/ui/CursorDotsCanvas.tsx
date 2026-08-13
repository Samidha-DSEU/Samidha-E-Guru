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
    const isMobile = window.innerWidth < 640;
    const mouse = {
      x: -1000,
      y: -1000,
      radius: isMobile ? 180 : 140, // Larger proximity activation radius on mobile touchscreen drag!
      active: false,
    };

    // Responsive dot density calculation
    const getSpacing = (w: number) => {
      if (w < 640) return 40; // Mobile: touch friendly grid spacing
      if (w < 1024) return 36; // Tablet
      return 32; // Desktop
    };

    let cols = 0;
    let rows = 0;

    const initCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const isDark = document.documentElement.classList.contains("dark");

      // Re-populate dot grid
      dots = [];
      const spacing = getSpacing(width);
      cols = Math.ceil(width / spacing) + 1;
      rows = Math.ceil(height / spacing) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;

          // Theme palette: Vibrant Cyan/Sky, Electric Indigo, Neon Violet
          const colors = isDark
            ? ["56, 189, 248", "129, 140, 248", "192, 132, 252"] // Vibrant neon dark mode colors
            : ["14, 165, 233", "99, 102, 241", "168, 85, 247"];

          const color = colors[(i + j) % colors.length];
          const baseAlpha = isDark ? Math.random() * 0.35 + 0.30 : Math.random() * 0.25 + 0.15;
          const baseSize = isDark ? Math.random() * 1.0 + 1.8 : Math.random() * 0.8 + 1.4;

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

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        mouse.x = touch.clientX - rect.left;
        mouse.y = touch.clientY - rect.top;
        mouse.active = true;
      }
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

      const isDark = document.documentElement.classList.contains("dark");

      // Draw subtle ambient grid mesh lines connecting matrix dots
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const idx = i * rows + j;
          const curr = dots[idx];
          if (!curr) continue;

          // Connect right neighbor
          if (i < cols - 1) {
            const right = dots[(i + 1) * rows + j];
            if (right) {
              ctx.beginPath();
              ctx.moveTo(curr.x, curr.y);
              ctx.lineTo(right.x, right.y);
              ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(14, 165, 233, 0.08)";
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }

          // Connect bottom neighbor
          if (j < rows - 1) {
            const bottom = dots[i * rows + (j + 1)];
            if (bottom) {
              ctx.beginPath();
              ctx.moveTo(curr.x, curr.y);
              ctx.lineTo(bottom.x, bottom.y);
              ctx.strokeStyle = isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(14, 165, 233, 0.08)";
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
        }
      }

      // Render & update dots
      const activeDotsNearCursor: Dot[] = [];

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Magnetic repulsion & size expansion on cursor / touch drag proximity
        if (dist < mouse.radius && mouse.active) {
          const force = (1 - dist / mouse.radius);
          const angle = Math.atan2(dy, dx);
          
          // Repel outward from cursor/touch point
          const targetX = dot.baseX - Math.cos(angle) * force * 24;
          const targetY = dot.baseY - Math.sin(angle) * force * 24;

          dot.x += (targetX - dot.x) * 0.15;
          dot.y += (targetY - dot.y) * 0.15;

          dot.size = dot.baseSize + force * 2.8;
          dot.alpha = Math.min(dot.baseAlpha + force * 0.6, 0.95);

          activeDotsNearCursor.push(dot);
        } else {
          // Smooth return to base grid position
          dot.x += (dot.baseX - dot.x) * 0.08;
          dot.y += (dot.baseY - dot.y) * 0.08;
          dot.size += (dot.baseSize - dot.size) * 0.08;
          dot.alpha += (dot.baseAlpha - dot.alpha) * 0.08;
        }

        // Draw Dot Particle
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dot.color}, ${dot.alpha})`;
        ctx.fill();
      }

      // Draw Constellation Connecting Lines between nearby active dots
      for (let i = 0; i < activeDotsNearCursor.length; i++) {
        for (let j = i + 1; j < activeDotsNearCursor.length; j++) {
          const d1 = activeDotsNearCursor[i];
          const d2 = activeDotsNearCursor[j];
          const ldx = d1.x - d2.x;
          const ldy = d1.y - d2.y;
          const lineDist = Math.sqrt(ldx * ldx + ldy * ldy);

          if (lineDist < 60) {
            const lineAlpha = (1 - lineDist / 60) * 0.35;
            ctx.beginPath();
            ctx.moveTo(d1.x, d1.y);
            ctx.lineTo(d2.x, d2.y);
            ctx.strokeStyle = isDark ? `rgba(56, 189, 248, ${lineAlpha})` : `rgba(14, 165, 233, ${lineAlpha})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    initCanvas();

    // Delayed init to catch Next.js theme hydration on initial mount
    const timer = setTimeout(() => {
      initCanvas();
    }, 150);

    // MutationObserver to re-initialize canvas dots when user toggles Dark/Light theme!
    let themeObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined") {
      themeObserver = new MutationObserver(() => {
        initCanvas();
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"]
      });
    }

    // Use ResizeObserver so canvas adjusts dot mesh when section content expands or contracts on tab switching!
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        initCanvas();
      });
      resizeObserver.observe(canvas.parentElement);
    }

    window.addEventListener("resize", initCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
      if (themeObserver) themeObserver.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", initCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full z-0 transition-opacity duration-500"
    />
  );
};
