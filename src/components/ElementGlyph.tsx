"use client";

/**
 * A small drawn glyph for the day's 五行 (day-master element), in the current
 * --element color. Used as the wordless "descend" control:
 *   火 flame · 水 droplet · 木 sprout · 金 blade · 土 mountain · (else) moon.
 */
export function ElementGlyph({ wuxing, size = 30, color = "var(--element)" }: { wuxing?: string; size?: number; color?: string }) {
  const c = color;
  const base = { width: size, height: size, viewBox: "0 0 24 24" } as const;
  const stroke = { fill: "none", stroke: c, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (wuxing) {
    case "fire":
      return (
        <svg {...base}>
          <path fill={c} d="M12 2C9 6 7 8 7 12a5 5 0 0 0 10 0c0-2-1-3.6-2-4.6.2 1.7-.6 2.6-1.3 3C14.6 8 13.5 4.8 12 2z" />
        </svg>
      );
    case "water":
      return (
        <svg {...base}>
          <path fill={c} d="M12 3.5c3 4 6 7.3 6 10.5a6 6 0 0 1-12 0c0-3.2 3-6.5 6-10.5z" />
        </svg>
      );
    case "wood":
      return (
        <svg {...base} {...stroke}>
          <path d="M12 21V8" />
          <path d="M12 13C8.5 12.5 7 9.5 8 6.5" />
          <path d="M12 11C15.5 10.5 17 7.5 16 4.5" />
        </svg>
      );
    case "metal":
      return (
        <svg {...base}>
          <path fill={c} d="M12 2l3.6 10L12 22 8.4 12z" />
        </svg>
      );
    case "earth":
      return (
        <svg {...base} {...stroke}>
          <path d="M3 19l5.5-9 3.5 5 3.5-7L21 19z" />
        </svg>
      );
    case "air":
      return (
        <svg {...base} {...stroke}>
          <path d="M3 9c3-2.5 7-2.5 10 0s5 2 6.5 0" />
          <path d="M3 14c2.5-2 7-2 9.5 0" />
          <path d="M3 18.5c2-1.5 5-1.5 7 0" />
        </svg>
      );
    default:
      return (
        <svg {...base} {...stroke}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
