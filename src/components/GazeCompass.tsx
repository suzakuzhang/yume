"use client";

import { useState } from "react";
import { ElementGlyph } from "@/components/ElementGlyph";

/**
 * 罗盘 — four gazes around a ring; the centre is the day's element. Tap the
 * centre: the needle spins and lands on a random gaze, then 入梦 (onEnter).
 * Minimal — just the compass + element, no text block.
 */
export interface CompassGaze {
  name: string;
  line?: string;
  quote?: string;
}

const META = [
  { color: "--lens-freud", portrait: "/portraits/freud.jpg", shape: "" as const },
  { color: "--lens-jung", portrait: "/portraits/jung.jpg", shape: "" as const },
  { color: "--lens-zhougong", portrait: "", shape: "taiji" as const }, // 术数
  { color: "--gold", portrait: "", shape: "butterfly" as const }, // 道家
];
const ANGLES = [0, 90, 180, 270];

export function GazeCompass({
  gazes,
  elementKey,
  elementColor,
  onEnter,
}: {
  gazes: CompassGaze[];
  elementKey?: string;
  elementColor: string;
  onEnter: () => void;
}) {
  const [rot, setRot] = useState(0);
  const [active, setActive] = useState(-1);
  const [spinning, setSpinning] = useState(false);
  const [reveal, setReveal] = useState(false);
  const R = 38;

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setActive(-1);
    const target = Math.floor(Math.random() * gazes.length);
    const base = rot - (rot % 360);
    setRot(base + 360 * 4 + ANGLES[target]);
    window.setTimeout(() => setActive(target), 1300);
    // mobile hides the inline caption — show a dedicated reveal page; desktop just enters.
    const mobile = typeof window !== "undefined" && window.matchMedia?.("(max-width: 639px)").matches;
    if (mobile) {
      window.setTimeout(() => setReveal(true), 1450);
    } else {
      window.setTimeout(() => onEnter(), 1750);
    }
  }

  // mobile: the drawn gaze, revealed full-screen with its caption, then 入梦.
  if (reveal && active >= 0) {
    const gz = gazes[active];
    const m = META[active];
    const c = `var(${m.color})`;
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-6 px-8 text-center yume-surface">
        <Avatar meta={m} color={c} size={84} />
        <span className="text-xl tracking-[0.2em]" style={{ color: c }}>{gz.name}</span>
        {gz.line && <p className="text-base leading-relaxed max-w-xs text-[var(--mist)]">{gz.line}</p>}
        {gz.quote && <p className="text-sm leading-relaxed max-w-xs text-[var(--muted)]">{gz.quote}</p>}
        <button
          onClick={onEnter}
          aria-label="入梦"
          className="elem-orb mt-4 inline-flex items-center justify-center rounded-full transition-transform duration-500 hover:scale-110"
          style={{ ["--g" as string]: elementColor, width: 72, height: 72, border: `1px solid ${elementColor}` } as React.CSSProperties}
        >
          <ElementGlyph wuxing={elementKey} color={elementColor} size={40} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: "min(80vw, 62vh, 460px)", height: "min(80vw, 62vh, 460px)" }}>
      {/* rings */}
      <div className="absolute inset-[6%] rounded-full" style={{ border: "1px solid var(--border)" }} />
      <div className="absolute inset-[22%] rounded-full" style={{ border: "1px solid var(--border-soft)" }} />

      {/* needle */}
      <div
        className="absolute"
        style={{
          left: "calc(50% - 1px)",
          top: "8%",
          width: 2,
          height: "42%",
          transformOrigin: "bottom center",
          transform: `rotate(${rot}deg)`,
          background: `linear-gradient(to top, transparent, ${elementColor})`,
          transition: "transform 1.5s cubic-bezier(0.18,0.7,0.2,1)",
        }}
      />

      {/* the four gazes */}
      {gazes.map((gz, i) => {
        const rad = ((ANGLES[i] - 90) * Math.PI) / 180;
        const x = 50 + R * Math.cos(rad);
        const y = 50 + R * Math.sin(rad);
        const on = i === active;
        return (
          <div
            key={i}
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) scale(${on ? 1.2 : 1})`, opacity: active < 0 || on ? 1 : 0.55 }}
          >
            <Avatar meta={META[i]} color={`var(${META[i].color})`} size={on ? 58 : 50} />
            <span className="hidden sm:block text-xs tracking-[0.15em]" style={{ color: on ? `var(${META[i].color})` : "var(--muted)" }}>
              {gz.name}
            </span>
          </div>
        );
      })}

      {/* centre — the day's element; tap to spin & enter */}
      <button
        onClick={spin}
        aria-label="入梦"
        disabled={spinning}
        className="elem-orb absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-500 hover:scale-105"
        style={{ ["--g" as string]: elementColor } as React.CSSProperties}
      >
        <span className="inline-flex items-center justify-center rounded-full" style={{ width: 96, height: 96, border: `1px solid ${elementColor}`, background: "radial-gradient(circle, color-mix(in srgb, var(--night-2) 85%, transparent), transparent)" }}>
          <ElementGlyph wuxing={elementKey} color={elementColor} size={56} />
        </span>
      </button>
    </div>
  );
}

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

function Avatar({ meta, color, size }: { meta: (typeof META)[number]; color: string; size: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full overflow-hidden"
      style={{ width: size, height: size, border: `1px solid ${color}`, boxShadow: `0 0 16px -4px ${color}`, background: `radial-gradient(circle at 50% 35%, color-mix(in srgb, ${color} 28%, transparent), transparent)` }}
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
