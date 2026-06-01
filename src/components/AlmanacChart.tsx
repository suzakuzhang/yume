"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import type { Almanac } from "@/lib/almanac";

/**
 * Homepage mystic background — image-forward, like the EN side:
 *   - blurred, circular-masked, slowly turning public-domain star chart
 *     (Cellarius for en, the 1247 Suzhou stone chart for zh)
 *   - a faint centered moon-phase disc (both locales)
 *   - en: sun-sign name on a gentle top arc
 *   - zh: 天干地支 / 四象 moved OFF-CENTER to the two side edges as faint
 *     vertical columns (traditional glyphs) so they never clash with the copy
 */

const C = 500;
const TRAD_FOUR: Record<string, string> = {
  "azure-dragon": "青龍",
  "vermilion-bird": "朱雀",
  "white-tiger": "白虎",
  "black-tortoise": "玄武",
};

function onArc(chars: string[], r: number, centerDeg: number, spreadDeg: number) {
  const n = chars.length;
  return chars.map((ch, i) => {
    const deg = centerDeg - spreadDeg / 2 + (n > 1 ? (spreadDeg * i) / (n - 1) : 0);
    const a = ((deg - 90) * Math.PI) / 180;
    return { ch, x: C + r * Math.cos(a), y: C + r * Math.sin(a), rot: deg };
  });
}

function MoonDisc({ illum }: { illum: number }) {
  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx={90} cy={90} r={78} fill="var(--moon)" opacity={0.04} />
      <circle cx={90} cy={90} r={78} fill="var(--mist)" opacity={0.07 * illum} />
    </svg>
  );
}

function SideColumn({ side, text, color }: { side: "left" | "right"; text: string; color: string }) {
  const edge = "clamp(0.4rem, 3vw, 3.5rem)";
  const style: React.CSSProperties = {
    writingMode: "vertical-rl",
    textOrientation: "upright",
    fontSize: "clamp(2rem, 5.5vh, 3.4rem)",
    letterSpacing: "0.35em",
    color,
    opacity: 0.22,
    filter: "blur(0.5px)",
    whiteSpace: "nowrap",
    left: side === "left" ? edge : undefined,
    right: side === "right" ? edge : undefined,
  };
  return (
    <div className="absolute top-1/2 -translate-y-1/2 select-none" style={style}>
      {text}
    </div>
  );
}

export function AlmanacChart({ data }: { data: Almanac | null }) {
  const { locale } = useLocale();

  useEffect(() => {
    if (!data) return;
    const el = locale === "zh" ? data.wuxing : data.western;
    document.documentElement.style.setProperty("--element", el.color);
  }, [data, locale]);

  if (!data) return null;
  const isZh = locale === "zh";

  return (
    <div aria-hidden className="fixed inset-0 -z-[5] pointer-events-none overflow-hidden">
      {/* blurred rotating star-chart image */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="yume-rotor"
          style={{
            width: "min(150vh, 150vw)",
            height: "min(150vh, 150vw)",
            backgroundImage: `url(/charts/${isZh ? "zh" : "en"}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "50%",
            filter: "blur(3px) saturate(0.7) brightness(0.8)",
            opacity: isZh ? 0.17 : 0.2,
            maskImage: "radial-gradient(circle, #000 55%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle, #000 55%, transparent 72%)",
          }}
        />
      </div>

      {/* faint centered moon disc (both) */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ filter: "blur(0.6px)" }}>
        <MoonDisc illum={data.moon.illum} />
      </div>

      {isZh ? (
        <>
          {/* 天干地支 / 四象 — pushed to the two side edges, vertical & traditional */}
          <SideColumn side="right" text={`${data.day.text}日`} color="var(--element)" />
          <SideColumn side="left" text={TRAD_FOUR[data.four.key]} color={data.four.color} />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ filter: "blur(0.6px)", opacity: 0.7 }}>
          <svg viewBox="0 0 1000 1000" style={{ width: "min(120vh,120vw)", height: "min(120vh,120vw)" }}>
            {onArc(data.sun.en.toUpperCase().split(""), 330, 0, Math.min(60, data.sun.en.length * 7)).map((c, i) => (
              <text
                key={i}
                x={c.x}
                y={c.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={54}
                fill="var(--gold)"
                opacity={0.5}
                transform={`rotate(${c.rot} ${c.x} ${c.y})`}
              >
                {c.ch}
              </text>
            ))}
            <text x={C} y={690} textAnchor="middle" fontSize={30} fill="var(--muted)" opacity={0.55}>
              {data.moon.enName} · {data.western.en}
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
