"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { AlmanacChart } from "@/components/AlmanacChart";
import { useNow } from "@/components/useNow";
import { GazeCompass, GAZE_KEYS, LEAD_GAZE_KEY } from "@/components/GazeCompass";
import { almanac } from "@/lib/almanac";
import { autoTz, clockText, COMMON_TZ } from "@/lib/almanac/time";

const SEQ = ["language", "threshold", "compass", "close"] as const;
const GITHUB_URL = "https://github.com/suzakuzhang";

export default function HomePage() {
  const { t, locale, setLocale, chosen, ready } = useLocale();
  const h = t.home;
  const inv = h.invocation;
  const [tz, setTz] = useState("");
  const [idx, setIdx] = useState(-1);
  const [falling, setFalling] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [pendingLang, setPendingLang] = useState<"zh" | "en" | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [lead, setLead] = useState("");
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

  // by the close, the gaze drawn at the compass is in storage — carry it through
  useEffect(() => {
    if (SEQ[idx] !== "close") return;
    try {
      const raw = localStorage.getItem(LEAD_GAZE_KEY);
      if (raw) setLead(JSON.parse(raw).gaze || "");
    } catch {
      /* ignore */
    }
  }, [idx]);

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
  // two-tap entry: first tap arms a side (the tongue floats up to be confirmed),
  // a second tap on the same side commits — a ripple blooms from the touch, then you fall in.
  // tapping the other side just switches the armed tongue. guards against a mis-touch dropping
  // you into a language you don't read.
  function tapLang(l: "zh" | "en", e: React.MouseEvent) {
    if (falling) return;
    if (pendingLang !== l) {
      setPendingLang(l);
      return;
    }
    setLocale(l);
    if (reduce) {
      go();
      return;
    }
    setRipple({ x: e.clientX, y: e.clientY });
    window.setTimeout(() => setRipple(null), 950);
    go();
  }

  if (idx < 0) return <AlmanacChart data={data} />;
  const step = SEQ[idx];
  const tzList = Array.from(new Set([tz, ...COMMON_TZ])).filter(Boolean);

  return (
    <>
      <AlmanacChart data={data} />
      {falling && <div aria-hidden className="fixed inset-0 z-30 yume-blackout" style={{ background: "#07060c" }} />}
      {ripple && (
        <div aria-hidden className="yume-ripple" style={{ left: ripple.x, top: ripple.y, zIndex: 40 }} />
      )}

      <div
        key={idx}
        className={`fixed inset-0 z-20 flex items-center justify-center px-6 overflow-y-auto ${falling ? "yume-plunge" : "yume-surface"}`}
      >
        {step === "language" && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 flex flex-col md:flex-row">
              <button
                onClick={(e) => tapLang("zh", e)}
                aria-label="Choose Chinese"
                className={`group flex-1 flex flex-col items-center justify-center gap-6 transition-all duration-500 ${
                  pendingLang === "zh" ? "bg-[rgba(179,166,239,0.08)]" : pendingLang ? "opacity-40" : "hover:bg-[rgba(179,166,239,0.05)]"
                }`}
              >
                <span className={`serif text-7xl tracking-[0.1em] glow transition-colors duration-500 ${pendingLang === "zh" ? "text-[var(--moon)]" : "text-[var(--mist)] group-hover:text-[var(--moon)]"}`}>夢</span>
                {pendingLang === "zh" ? (
                  <span className="lang-confirm text-sm tracking-[0.4em] text-[var(--moon)]">Choose Chinese</span>
                ) : (
                  <span className="text-sm tracking-[0.5em] text-[var(--muted)] group-hover:text-[var(--moon)] transition-colors duration-500">入梦</span>
                )}
              </button>
              <button
                onClick={(e) => tapLang("en", e)}
                aria-label="Choose English"
                className={`group flex-1 flex flex-col items-center justify-center gap-6 border-t border-[var(--border)] md:border-t-0 md:border-l transition-all duration-500 ${
                  pendingLang === "en" ? "bg-[rgba(179,166,239,0.08)]" : pendingLang ? "opacity-40" : "hover:bg-[rgba(179,166,239,0.05)]"
                }`}
              >
                <span className={`serif text-6xl tracking-[0.12em] transition-colors duration-500 ${pendingLang === "en" ? "text-[var(--moon)]" : "text-[var(--mist)] group-hover:text-[var(--moon)]"}`}>dream</span>
                {pendingLang === "en" ? (
                  <span className="lang-confirm text-sm tracking-[0.4em] text-[var(--moon)]">Choose English</span>
                ) : (
                  <span className="text-sm tracking-[0.5em] text-[var(--muted)] group-hover:text-[var(--moon)] transition-colors duration-500">drift in</span>
                )}
              </button>
            </div>
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-[var(--muted)] z-10">
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
            <p className="serif text-2xl md:text-3xl leading-relaxed max-w-2xl text-[var(--mist)]">{inv.opening}</p>
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
              enterLabel={h.enter}
              drawLabel={locale === "zh" ? "摇一目光" : "draw a gaze"}
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
            {lead && (() => {
              const li = GAZE_KEYS.indexOf(lead);
              const lg = li >= 0 ? h.compass.gazes[li] : null;
              return lg?.quote ? (
                <p className="serif lang-confirm text-base md:text-lg leading-relaxed max-w-md text-[var(--mist)] italic">{lg.quote}</p>
              ) : null;
            })()}
            <p className="serif text-2xl md:text-3xl text-[var(--gold)] tracking-[0.18em] glow leading-snug">{inv.maxim}</p>
            <a
              href="/today"
              aria-label={h.enter}
              className="elem-orb text-5xl mt-2 transition-transform duration-500 hover:scale-110"
              style={{ ["--g" as string]: "var(--element)" } as React.CSSProperties}
            >
              🌙
            </a>
            <a href="/diary" className="text-xs tracking-[0.3em] text-[var(--muted)] hover:text-[var(--moon)]">
              {t.nav.timeline}
            </a>
          </div>
        )}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 text-xs tracking-[0.18em] text-[var(--muted)] underline underline-offset-4 transition-colors hover:text-[var(--moon)]"
        >
          Designed by Shumin Zhang
        </a>
      </div>
    </>
  );
}
