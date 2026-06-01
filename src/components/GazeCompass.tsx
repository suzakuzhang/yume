"use client";

import { useState } from "react";

/**
 * 罗盘 — the four gazes around a ring. Hover a mark and the needle swings to it;
 * the centre reveals that gaze's portrait, a line of description, and a quote.
 * Consolidates the old "gazes" + "mirror" panels.
 */
export interface CompassGaze {
  name: string;
  line: string;
  quote: string;
}

const META: { color: string; portrait: string; shape: "" | "taiji" | "butterfly" }[] = [
  { color: "--lens-freud", portrait: "/portraits/freud.jpg", shape: "" },
  { color: "--lens-jung", portrait: "/portraits/jung.jpg", shape: "" },
  { color: "--lens-zhougong", portrait: "", shape: "taiji" }, // 术数 — taiji (root of 易象数)
  { color: "--gold", portrait: "", shape: "butterfly" }, // 道家 — 庄周梦蝶
];

function Taiji({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M50 4 a46 46 0 0 1 0 92 a23 23 0 0 1 0-46 a23 23 0 0 0 0-46 z" fill={color} />
      <circle cx="50" cy="27" r="7" fill="var(--night-0)" />
      <circle cx="50" cy="73" r="7" fill={color} />
    </svg>
  );
}

function Butterfly({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path fill={color} stroke="none" d="M50 50 C30 24 6 34 17 52 C6 73 40 66 50 50Z M50 50 C70 24 94 34 83 52 C94 73 60 66 50 50Z" />
      <ellipse cx="50" cy="52" rx="2.3" ry="12" fill={color} stroke="none" />
      <path strokeWidth="2" d="M49 41 C46 31 41 28 38 26" />
      <path strokeWidth="2" d="M51 41 C54 31 59 28 62 26" />
    </svg>
  );
}
const ANGLES = [0, 90, 180, 270]; // top, right, bottom, left (clockwise from top)

export function GazeCompass({ gazes }: { gazes: CompassGaze[] }) {
  const [active, setActive] = useState(0);
  const R = 38; // ring radius as % of half-size
  const g = gazes[active];
  const m = META[active];
  const aColor = `var(${m.color})`;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative" style={{ width: "min(64vh, 88vw)", height: "min(64vh, 88vw)", maxWidth: 480, maxHeight: 480 }}>
        {/* ring */}
        <div className="absolute inset-[8%] rounded-full" style={{ border: "1px solid var(--border)" }} />
        <div className="absolute inset-[20%] rounded-full" style={{ border: "1px solid var(--border-soft)" }} />

        {/* needle — swings to the active mark (base anchored at compass centre) */}
        <div
          className="absolute"
          style={{
            left: "calc(50% - 1px)",
            top: "8%",
            width: 2,
            height: "42%",
            transformOrigin: "bottom center",
            transform: `rotate(${ANGLES[active]}deg)`,
            background: `linear-gradient(to top, transparent, ${aColor})`,
            transition: "transform 0.7s cubic-bezier(0.22,0.61,0.36,1)",
          }}
        />

        {/* centre reveal */}
        <div className="absolute inset-[26%] rounded-full flex flex-col items-center justify-center text-center px-3 gap-2"
             style={{ background: `radial-gradient(circle, color-mix(in srgb, ${aColor} 10%, transparent), transparent 75%)` }}>
          <span key={active} className="yume-surface flex flex-col items-center gap-2">
            <Avatar meta={m} color={aColor} size={56} />
            <p className="text-base" style={{ color: aColor }}>{g.name}</p>
          </span>
        </div>

        {/* the four marks */}
        {gazes.map((gz, i) => {
          const rad = ((ANGLES[i] - 90) * Math.PI) / 180;
          const x = 50 + R * Math.cos(rad);
          const y = 50 + R * Math.sin(rad);
          const on = i === active;
          return (
            <button
              key={i}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className="elem-orb absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-500"
              style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) scale(${on ? 1.18 : 1})`, ["--g" as string]: `var(${META[i].color})` } as React.CSSProperties}
              aria-label={gz.name}
            >
              <Avatar meta={META[i]} color={`var(${META[i].color})`} size={on ? 60 : 50} dim={!on} />
            </button>
          );
        })}
      </div>

      {/* line + quote for the active gaze */}
      <div key={`t-${active}`} className="yume-surface text-center max-w-xl space-y-2 min-h-[5.5rem]">
        <p className="text-lg md:text-xl leading-relaxed">
          <span style={{ color: aColor }}>{g.name}</span>
          <span className="text-[var(--mist)]">{g.line}</span>
        </p>
        <p className="text-[var(--muted)] italic leading-relaxed">{g.quote}</p>
      </div>
    </div>
  );
}

function Avatar({ meta, color, size, dim }: { meta: (typeof META)[number]; color: string; size: number; dim?: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        border: `1px solid ${color}`,
        boxShadow: `0 0 ${dim ? 8 : 18}px -4px ${color}`,
        background: `radial-gradient(circle at 50% 35%, color-mix(in srgb, ${color} 30%, transparent), transparent)`,
        opacity: dim ? 0.6 : 1,
      }}
    >
      {meta.portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.portrait} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : meta.shape === "taiji" ? (
        <Taiji size={size * 0.66} color={color} />
      ) : (
        <Butterfly size={size * 0.74} color={color} />
      )}
    </span>
  );
}
