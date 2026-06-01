"use client";

import { useLocale } from "@/components/LocaleProvider";
import { clockText, COMMON_TZ } from "@/lib/almanac/time";
import type { Almanac } from "@/lib/almanac";

/** The live "now" line: today's element ground-note + ticking 时柱/clock + a timezone override. */
export function NowPanel({
  data,
  tz,
  setTz,
  now,
}: {
  data: Almanac;
  tz: string;
  setTz: (s: string) => void;
  now: Date;
}) {
  const { locale } = useLocale();
  const elem = locale === "zh" ? data.wuxing : data.western;
  const tzList = Array.from(new Set([tz, ...COMMON_TZ])).filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-2 text-sm tracking-[0.18em]">
      <div className="flex items-center gap-2 text-base">
        <span className="elem-glow" style={{ color: "var(--element)" }}>
          {locale === "zh"
            ? `今日 ${data.day.text} · ${data.wuxing.cn}`
            : `today · ☉ ${data.sun.en} · ${data.western.en}`}
        </span>
        <span className="text-[var(--muted)]">·</span>
        <span className="text-[var(--mist)]">
          {locale === "zh" ? `${data.hour.text}时 ${clockText(now)}` : clockText(now)}
        </span>
      </div>
      <span className="text-[var(--muted)] opacity-70">{elem.imagery}</span>
      <label className="flex items-center gap-1.5 text-[var(--muted)]">
        <span className="opacity-60">{locale === "zh" ? "时区" : "zone"}</span>
        <select
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className="bg-transparent border border-[var(--border)] rounded px-1.5 py-0.5 outline-none text-[var(--muted)] tracking-normal"
        >
          {tzList.map((z) => (
            <option key={z} value={z} style={{ background: "#1a1730" }}>
              {z}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
