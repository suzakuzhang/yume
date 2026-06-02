"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { AlmanacChart } from "@/components/AlmanacChart";
import { useNow } from "@/components/useNow";
import { GazeCompass } from "@/components/GazeCompass";
import { almanac } from "@/lib/almanac";
import { autoTz, clockText, COMMON_TZ } from "@/lib/almanac/time";

const SEQ = ["language", "threshold", "compass", "close"] as const;

export default function HomePage() {
  const { t, locale, setLocale, chosen, ready } = useLocale();
  const h = t.home;
  const inv = h.invocation;
  const [tz, setTz] = useState("");
  const [idx, setIdx] = useState(-1);
  const [falling, setFalling] = useState(false);
  const [reduce, setReduce] = useState(false);
  const inited = useRef(false);
  const now = useNow(tz);
  const data = now ? almanac(now) : null;

  useEffect(() => {
    setTz(autoTz());
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setReduce(true);
  }, []);

  // always open on the language panel
  useEffect(() => {
    if (ready && !inited.current) {
      inited.current = true;
      setIdx(0);
    }
  }, [ready, chosen]);

  // no scroll anywhere in the deck
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  function go() {
    if (falling) return;
    if (reduce) {
      setIdx((i) => Math.min(i + 1, SEQ.length - 1));
      return;
    }
    setFalling(true);
    window.setTimeout(() => {
      setIdx((i) => Math.min(i + 1, SEQ.length - 1));
      setFalling(false);
    }, 660);
  }
  function chooseLang(l: "zh" | "en") {
    setLocale(l);
    go();
  }

  if (idx < 0) return <AlmanacChart data={data} />;
  const step = SEQ[idx];
  const tzList = Array.from(new Set([tz, ...COMMON_TZ])).filter(Boolean);

  return (
    <>
      <AlmanacChart data={data} />
      {falling && <div aria-hidden className="fixed inset-0 z-30 yume-blackout" style={{ background: "#07060c" }} />}

      <div
        key={idx}
        className={`fixed inset-0 z-20 flex items-center justify-center px-6 overflow-y-auto ${falling ? "yume-plunge" : "yume-surface"}`}
      >
        {step === "language" && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 flex flex-col md:flex-row">
              <button onClick={() => chooseLang("zh")} className="group flex-1 flex flex-col items-center justify-center gap-6 transition-colors duration-500 hover:bg-[rgba(179,166,239,0.05)]">
                <span className="text-7xl tracking-[0.1em] text-[var(--mist)] glow group-hover:text-[var(--moon)] transition-colors duration-500">夢</span>
                <span className="text-sm tracking-[0.5em] text-[var(--muted)] group-hover:text-[var(--moon)] transition-colors duration-500">入梦</span>
              </button>
              <button onClick={() => chooseLang("en")} className="group flex-1 flex flex-col items-center justify-center gap-6 border-t border-[var(--border)] md:border-t-0 md:border-l transition-colors duration-500 hover:bg-[rgba(179,166,239,0.05)]">
                <span className="text-6xl tracking-[0.12em] text-[var(--mist)] group-hover:text-[var(--moon)] transition-colors duration-500">dream</span>
                <span className="text-sm tracking-[0.5em] text-[var(--muted)] group-hover:text-[var(--moon)] transition-colors duration-500">drift in</span>
              </button>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-[var(--muted)] z-10">
              <span className="opacity-60 tracking-[0.2em]">时区 / zone</span>
              <select
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="bg-transparent border border-[var(--border)] rounded px-2 py-1 outline-none text-[var(--muted)]"
              >
                {tzList.map((z) => (
                  <option key={z} value={z} style={{ background: "#1a1730" }}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === "threshold" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6">
            <h1 className="text-5xl tracking-[0.14em]">
              yume <span className="text-[var(--accent)] glow">{t.brand}</span>
            </h1>
            <p className="text-2xl md:text-3xl leading-relaxed max-w-2xl text-[var(--mist)]">{inv.opening}</p>
            {data && now && (
              <span className="text-base tracking-[0.18em] text-[var(--mist)]">
                <span className="elem-glow" style={{ color: "var(--element)" }}>
                  {locale === "zh"
                    ? `${data.day.text} · ${data.wuxing.cn}`
                    : `☉ ${data.sun.en} · ${data.western.en}`}
                </span>
                {"  ☾ "}
                {clockText(now)}
              </span>
            )}
            <button onClick={go} className="btn-moon mt-2">{h.enter}</button>
          </div>
        )}

        {step === "compass" && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <GazeCompass
              gazes={h.compass.gazes}
              elementKey={locale === "zh" ? data?.wuxing.key : data?.western.key}
              elementColor="var(--element)"
              onEnter={go}
            />
          </div>
        )}

        {step === "close" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center">
            {data && now && (
              <span className="text-sm tracking-[0.18em]">
                <span className="elem-glow" style={{ color: "var(--element)" }}>
                  {locale === "zh" ? `${data.day.text} · ${data.wuxing.cn}` : `☉ ${data.sun.en} · ${data.western.en}`}
                </span>
                <span className="text-[var(--mist)]">{"  ☾ "}{clockText(now)}</span>
              </span>
            )}
            <p className="text-2xl md:text-3xl text-[var(--gold)] tracking-[0.18em] glow leading-snug">{inv.maxim}</p>
            <a
              href="/login"
              aria-label={h.enter}
              className="elem-orb text-5xl mt-2 transition-transform duration-500 hover:scale-110"
              style={{ ["--g" as string]: "var(--element)" } as React.CSSProperties}
            >
              🌙
            </a>
            <a href="/journal" className="text-xs tracking-[0.3em] text-[var(--muted)] hover:text-[var(--moon)]">
              {t.nav.timeline}
            </a>
          </div>
        )}
      </div>
    </>
  );
}
