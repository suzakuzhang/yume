"use client";

import { useEffect, useState } from "react";
import { ElementGlyph } from "@/components/ElementGlyph";

/**
 * 四目光 — a brief: the four gazes hang along an arc, and whichever you move onto
 * rises to the centre, enlarged, with its line + saying so a newcomer learns who it
 * is. On arrival the gaze you last drew is centred. Move onto a face to read it; tap
 * the centred face to choose it and fall in. The element orb draws one at random.
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
// four seats evenly spaced (x gaps of 24) along a gentle downward arc — a valley dipping in the middle
const ARC = [
  { x: 14, y: 18 },
  { x: 38, y: 30 },
  { x: 62, y: 30 },
  { x: 86, y: 18 },
];
const LENS_KEYS = ["freud", "jung", "shuxu", "daoism"]; // arc order → debate lens keys
export const GAZE_KEYS = LENS_KEYS;
export const LEAD_GAZE_KEY = "yume_lead_gaze";

/** The drawn gaze's mark, reusable elsewhere. */
export function GazeStar({ gazeKey, size = 64 }: { gazeKey: string; size?: number }) {
  const i = LENS_KEYS.indexOf(gazeKey);
  if (i < 0) return null;
  return <Avatar meta={META[i]} color={`var(${META[i].color})`} size={size} />;
}

function readLead(): number {
  try {
    const raw = localStorage.getItem(LEAD_GAZE_KEY);
    if (raw) {
      const idx = LENS_KEYS.indexOf(JSON.parse(raw).gaze);
      if (idx >= 0) return idx;
    }
  } catch {
    /* ignore */
  }
  return -1;
}
function storeLead(i: number) {
  try {
    const key = LENS_KEYS[i];
    if (key) localStorage.setItem(LEAD_GAZE_KEY, JSON.stringify({ gaze: key, date: new Date().toISOString().slice(0, 10) }));
  } catch {
    /* ignore */
  }
}

export function GazeCompass({
  gazes,
  elementKey,
  elementColor,
  onEnter,
  enterLabel,
  drawLabel,
}: {
  gazes: CompassGaze[];
  elementKey?: string;
  elementColor: string;
  onEnter: () => void;
  enterLabel: string;
  drawLabel: string;
}) {
  const [active, setActive] = useState(-1);
  const [lead, setLead] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    const l = readLead();
    const i = l >= 0 ? l : 0;
    setLead(i);
    setActive(i);
  }, []);

  // confirm step — choosing a gaze only centres it; you fall in via the confirm button
  function confirm() {
    if (committed || drawing || active < 0) return;
    setCommitted(true);
    storeLead(active);
    window.setTimeout(() => onEnter(), 520);
  }
  // move onto / tap a face → it rises to the centre (preview only, no entering)
  function previewFace(i: number) {
    if (drawing || committed) return;
    setActive(i);
  }
  function draw() {
    if (drawing || committed) return;
    setDrawing(true);
    const target = Math.floor(Math.random() * gazes.length);
    let step = 0;
    const hop = window.setInterval(() => {
      setActive((a) => (a + 1) % gazes.length);
      step += 1;
      if (step > 9) {
        window.clearInterval(hop);
        setActive(target);
        setDrawing(false);
      }
    }, 110);
  }

  const gz = active >= 0 ? gazes[active] : null;
  const aColor = active >= 0 ? `var(${META[active].color})` : elementColor;

  return (
    <div className="flex flex-col items-center gap-4" onMouseLeave={() => !drawing && !committed && setActive(lead)}>
      <div className="relative" style={{ width: "min(80vw, 50vh, 440px)", height: "min(80vw, 50vh, 440px)" }}>
        {/* centre — the gaze you're reading, enlarged (display only) */}
        <div
          aria-hidden
          className="absolute left-1/2 rounded-full overflow-hidden"
          style={{ top: "64%", transform: "translate(-50%,-50%)", width: "32%", height: "32%", border: `1px solid ${aColor}`, boxShadow: `0 0 30px -6px ${aColor}` }}
        >
          {active >= 0 && <Avatar meta={META[active]} color={aColor} size={9999} fill />}
        </div>

        {/* four gazes along the arc */}
        {gazes.map((g, i) => {
          const on = i === active;
          const c = `var(${META[i].color})`;
          return (
            <button
              key={i}
              onMouseEnter={() => previewFace(i)}
              onFocus={() => previewFace(i)}
              onClick={() => previewFace(i)}
              aria-label={g.name}
              aria-pressed={on}
              className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
              style={{ left: `${ARC[i].x}%`, top: `${ARC[i].y}%`, transform: `translate(-50%,-50%) scale(${on ? 1.12 : 1})`, opacity: on ? 1 : 0.55 }}
            >
              <Avatar meta={META[i]} color={c} size={on ? 56 : 46} dim={!on} />
              <span className="hidden sm:block text-[11px] tracking-[0.14em]" style={{ color: on ? c : "var(--muted)" }}>
                {g.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* the centred gaze speaks — its line + saying, as a brief intro */}
      <div key={active} className="yume-surface text-center max-w-md min-h-[5rem] space-y-2 px-4">
        {gz && (
          <>
            <p className="text-sm tracking-[0.18em]" style={{ color: aColor }}>{gz.name}</p>
            {gz.quote && <p className="serif text-base md:text-lg text-[var(--mist)] italic leading-relaxed">{gz.quote}</p>}
          </>
        )}
      </div>

      {/* confirm — choosing only centres; you fall in here */}
      <div className="flex items-center gap-4">
        <button onClick={confirm} disabled={committed || drawing || active < 0} className="btn-moon disabled:opacity-50">
          {gz ? `${gz.name} · ${enterLabel}` : enterLabel}
        </button>
        <button
          onClick={draw}
          disabled={drawing || committed}
          aria-label={drawLabel}
          title={drawLabel}
          className="elem-orb inline-flex items-center justify-center rounded-full transition-transform duration-500 hover:scale-110 disabled:opacity-60"
          style={{ ["--g" as string]: elementColor, width: 56, height: 56, border: `1px solid ${elementColor}` } as React.CSSProperties}
        >
          <ElementGlyph wuxing={elementKey} color={elementColor} size={32} />
        </button>
      </div>
    </div>
  );
}

function Taiji({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ width: "100%", height: "100%" }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="2.5" />
      <path d="M50 4 a46 46 0 0 1 0 92 a23 23 0 0 1 0-46 a23 23 0 0 0 0-46 z" fill={color} />
      <circle cx="50" cy="27" r="7" fill="var(--night-0)" />
      <circle cx="50" cy="73" r="7" fill={color} />
    </svg>
  );
}

function Butterfly({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <path fill={color} stroke="none" d="M50 50 C30 24 6 34 17 52 C6 73 40 66 50 50Z M50 50 C70 24 94 34 83 52 C94 73 60 66 50 50Z" />
      <ellipse cx="50" cy="52" rx="2.3" ry="12" fill={color} stroke="none" />
      <path strokeWidth="2" d="M49 41 C46 31 41 28 38 26" />
      <path strokeWidth="2" d="M51 41 C54 31 59 28 62 26" />
    </svg>
  );
}

function Avatar({ meta, color, size, dim, fill }: { meta: (typeof META)[number]; color: string; size: number; dim?: boolean; fill?: boolean }) {
  const box = fill ? { width: "100%", height: "100%" } : { width: size, height: size };
  return (
    <span
      className="inline-flex items-center justify-center rounded-full overflow-hidden"
      style={{
        ...box,
        border: fill ? "none" : `1px solid ${color}`,
        boxShadow: fill ? "none" : `0 0 ${dim ? 8 : 20}px -4px ${color}`,
        background: `radial-gradient(circle at 50% 35%, color-mix(in srgb, ${color} 28%, transparent), transparent)`,
      }}
    >
      {meta.portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.portrait} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: dim ? 0.62 : 1 }} />
      ) : meta.shape === "taiji" ? (
        <span style={{ width: fill ? "70%" : size * 0.66, height: fill ? "70%" : size * 0.66, display: "inline-flex" }}>
          <Taiji size={fill ? 100 : size * 0.66} color={color} />
        </span>
      ) : (
        <span style={{ width: fill ? "78%" : size * 0.74, height: fill ? "78%" : size * 0.74, display: "inline-flex" }}>
          <Butterfly size={fill ? 100 : size * 0.74} color={color} />
        </span>
      )}
    </span>
  );
}
