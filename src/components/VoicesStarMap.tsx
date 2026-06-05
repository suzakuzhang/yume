"use client";

import { useState } from "react";
import { SPIRITS } from "@/lib/debate/personas";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 众声 as a constellation. The dream itself (梦之灵 = the 凝象 image) sits at the
 * heart; the five interpreting spirits orbit it. The gaze you drew is the brightest
 * star; the rest are dim until you move onto them. By default you see only your
 * chosen gaze's reading — hover another star to hear it, the centre for the dream's
 * own line.
 *
 *  glyphs: 周易/卦灵 = 太极 · 塔罗/牌灵 = 🔮 · 道家/弗洛伊德/荣格 = portrait · 梦之灵 = the dream image
 *  术数 lead splits: zh → 卦灵(周易) is brightest, en → 牌灵(塔罗).
 */
const ORBIT = ["freud", "jung", "daoism", "gua", "pai"] as const;
const ANG = [0, 72, 144, 216, 288]; // pentagon, brightest placed at the top
const RING = 40; // orbit radius as % of half-size

export function VoicesStarMap({
  views,
  cast,
  tarot,
  imageUrl,
  painterly,
  imagery,
  leadGaze,
  locale,
  leadLabel,
}: {
  views: any[];
  cast: any;
  tarot: any;
  imageUrl?: string;
  painterly?: string;
  imagery?: string[];
  leadGaze: string;
  locale: "zh" | "en";
  leadLabel?: string;
}) {
  const sp = (k: string) => SPIRITS.find((s) => s.key === k)!;
  const nameOf = (k: string) => (locale === "zh" ? sp(k).nameZh : sp(k).nameEn);
  const colorOf = (k: string) => `var(${sp(k).colorVar})`;
  const viewOf = (k: string) => (views || []).find((v: any) => v.key === k);

  function detailFor(k: string): string {
    if (k === "dream") return painterly || (imagery || []).join(locale === "zh" ? "、" : " · ");
    if (k === "gua") {
      if (!cast) return "";
      if (locale === "en")
        return `${cast.original.name_en ?? cast.original.fullName} — ${cast.original.judgment_en ?? cast.original.guaCi}${cast.changed ? ` → ${cast.changed.name_en ?? cast.changed.fullName}` : ""}`;
      return `本卦${cast.original.fullName}「${cast.original.guaCi}」${cast.changed ? ` 变${cast.changed.fullName}` : ""}`;
    }
    if (k === "pai") {
      if (!tarot) return "";
      const o = tarot.orientation === "reversed" ? (locale === "zh" ? "逆位" : "reversed") : locale === "zh" ? "正位" : "upright";
      const nm = locale === "zh" ? tarot.name_zh : tarot.name_en;
      return `${nm}（${o}）${tarot.reading?.core ?? ""}`;
    }
    const v = viewOf(k);
    return v ? v.statement || v.stance : "";
  }

  // 术数 lead → zh 卦灵 / en 牌灵; else the drawn gaze itself
  const mapped = leadGaze === "shuxu" ? (locale === "en" ? "pai" : "gua") : leadGaze;
  const brightest = (ORBIT as readonly string[]).includes(mapped) ? mapped : "gua";
  const order = [brightest, ...ORBIT.filter((k) => k !== brightest)];

  const [active, setActive] = useState<string>(brightest);
  const reset = () => setActive(brightest);

  return (
    <div className="flex flex-col items-center gap-4 w-full" onMouseLeave={reset}>
      <div className="relative" style={{ width: "min(82vw, 46vh, 400px)", height: "min(82vw, 46vh, 400px)" }}>
        {/* a single clean five-pointed star joining the five gazes around the dream */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" aria-hidden>
          <polygon
            points="50,10 73.51,82.36 11.96,37.64 88.04,37.64 26.49,82.36"
            fill="none"
            stroke="var(--border-soft)"
            strokeWidth="0.4"
            strokeLinejoin="round"
          />
        </svg>

        {/* 梦之灵 — the dream itself, at the heart */}
        <button
          onMouseEnter={() => setActive("dream")}
          onFocus={() => setActive("dream")}
          onClick={() => setActive("dream")}
          aria-label={nameOf("dream")}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden transition-transform duration-500 hover:scale-105"
          style={{
            width: "30%",
            height: "30%",
            border: `1px solid var(--accent)`,
            boxShadow: `0 0 26px -6px var(--accent)`,
            background: imageUrl ? undefined : "radial-gradient(circle, color-mix(in srgb, var(--accent) 24%, transparent), transparent)",
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span className="text-2xl" style={{ color: "var(--accent)" }}>{locale === "zh" ? "凝" : "☾"}</span>
          )}
        </button>

        {/* the five orbiting gazes */}
        {order.map((k, idx) => {
          const rad = ((ANG[idx] - 90) * Math.PI) / 180;
          const x = 50 + RING * Math.cos(rad);
          const y = 50 + RING * Math.sin(rad);
          const lit = k === active || k === brightest;
          const c = colorOf(k);
          const portrait = sp(k).portrait;
          return (
            <button
              key={k}
              onMouseEnter={() => setActive(k)}
              onFocus={() => setActive(k)}
              onClick={() => setActive(k)}
              aria-label={nameOf(k)}
              aria-pressed={k === active}
              className="absolute inline-flex items-center justify-center rounded-full overflow-hidden -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: lit ? 54 : 46,
                height: lit ? 54 : 46,
                transform: `translate(-50%,-50%) scale(${k === active ? 1.16 : 1})`,
                opacity: lit ? 1 : 0.42,
                border: `1px solid ${c}`,
                boxShadow: lit ? `0 0 18px -3px ${c}` : `0 0 8px -5px ${c}`,
                background: `radial-gradient(circle at 50% 35%, color-mix(in srgb, ${c} 26%, transparent), transparent)`,
              }}
            >
              {portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={portrait} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: lit ? 1 : 0.7 }} />
              ) : k === "gua" ? (
                <Taiji size={(lit ? 54 : 46) * 0.62} color={c} />
              ) : (
                <span style={{ fontSize: lit ? 22 : 18, lineHeight: 1 }}>🔮</span>
              )}
            </button>
          );
        })}
      </div>

      {/* only the lit star speaks; hover another to hear it */}
      <div key={active} className="yume-surface surface p-3 text-left max-w-lg w-full min-h-[4.5rem]" style={{ borderLeft: `2px solid ${active === "dream" ? "var(--accent)" : colorOf(active)}` }}>
        <span className="text-xs flex items-center gap-2" style={{ color: active === "dream" ? "var(--accent)" : colorOf(active) }}>
          {nameOf(active)}
          {active === brightest && leadLabel && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] tracking-[0.1em]" style={{ border: `1px solid ${colorOf(active)}` }}>{leadLabel}</span>
          )}
        </span>
        <p className="text-[var(--mist)] text-sm leading-relaxed mt-1">{detailFor(active)}</p>
      </div>
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
