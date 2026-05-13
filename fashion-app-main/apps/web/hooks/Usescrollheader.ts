// hooks/useScrollHeader.ts
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns `visible: boolean`.
 * - true  → header is shown (scroll up or at top)
 * - false → header is hidden (scrolled down past threshold)
 */
export function useScrollHeader(threshold = 10) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastY.current;

        if (currentY < 60) {
          // Always show near the top
          setVisible(true);
        } else if (diff > threshold) {
          // Scrolling DOWN → hide
          setVisible(false);
        } else if (diff < -threshold) {
          // Scrolling UP → show
          setVisible(true);
        }

        lastY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return visible;
}