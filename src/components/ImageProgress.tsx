"use client";

import { useEffect, useState } from "react";
import { ElementGlyph } from "@/components/ElementGlyph";

/**
 * A beautiful element-themed loader for 凝象 (image generation, which is slow).
 * A ring fills in the day's element color around the day's element glyph
 * (flame/water/wood/metal/earth · or air for the Western chart). Progress is
 * eased toward ~92% while generating, then completes when `done`.
 */
export function ImageProgress({ wuxing, color, done }: { wuxing?: string; color: string; done?: boolean }) {
  const [p, setP] = useState(0.05);

  useEffect(() => {
    if (done) {
      setP(1);
      return;
    }
    const id = setInterval(() => setP((prev) => prev + (0.92 - prev) * 0.05), 220);
    return () => clearInterval(id);
  }, [done]);

  const R = 46;
  const CIRC = 2 * Math.PI * R;
  return (
    <div className="relative" style={{ width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border)" strokeWidth="1.2" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - p)}
          style={{ transition: "stroke-dashoffset 0.5s ease", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="elem-orb" style={{ ["--g" as string]: color } as React.CSSProperties}>
          <ElementGlyph wuxing={wuxing} color={color} size={58} />
        </span>
      </div>
    </div>
  );
}
