"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { AlmanacChart } from "@/components/AlmanacChart";
import { NowPanel } from "@/components/NowPanel";
import { useNow } from "@/components/useNow";
import { ElementGlyph } from "@/components/ElementGlyph";
import { GazeCompass } from "@/components/GazeCompass";
import { almanac } from "@/lib/almanac";
import { autoTz, clockText } from "@/lib/almanac/time";

function Lines({ lines, className }: { lines: readonly string[]; className?: string }) {
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <span className={className}>{l}</span>
        </Fragment>
      ))}
    </>
  );
}

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

  return (
    <>
      <AlmanacChart data={data} />
      {falling && <div aria-hidden className="fixed inset-0 z-30 yume-blackout" style={{ background: "#07060c" }} />}

      <div
        key={idx}
        className={`fixed inset-0 z-20 flex items-center justify-center px-6 overflow-y-auto ${falling ? "yume-plunge" : "yume-surface"}`}
      >
        {step === "language" && (
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto py-10">
            <GazeCompass gazes={h.compass.gazes} />
            <button
              onClick={go}
              aria-label={h.descend}
              className="elem-orb transition-transform duration-500 hover:scale-110"
              style={{ ["--g" as string]: "var(--element)" } as React.CSSProperties}
            >
              <ElementGlyph wuxing={locale === "zh" ? data?.wuxing.key : data?.western.key} size={46} />
            </button>
          </div>
        )}

        {step === "close" && (
          <div className="flex flex-col items-center justify-center gap-7 px-6 text-center max-w-2xl">
            <p className="text-lg text-[var(--muted)] leading-loose">
              <Lines lines={inv.closing} />
            </p>
            <p>
              <span className="text-[var(--gold)] tracking-[0.22em] text-xl">{inv.maxim}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-base tracking-[0.2em] text-[var(--mist)]">
              {h.arc.map((s, i) => (
                <span key={s} className="flex items-center gap-4">
                  <span>{s}</span>
                  {i < h.arc.length - 1 && <span style={{ color: "var(--element)" }}>·</span>}
                </span>
              ))}
            </div>
            {data && now && <NowPanel data={data} tz={tz} setTz={setTz} now={now} />}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a href="/today" className="btn-moon">{h.ctaCross}</a>
              <a href="/journal" className="btn-veil">{h.ctaRevisit}</a>
              <a href="/login" className="btn-veil">{h.ctaSignin}</a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
