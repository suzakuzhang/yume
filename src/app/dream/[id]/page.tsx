"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { ElementGlyph } from "@/components/ElementGlyph";
import { ImageProgress } from "@/components/ImageProgress";
import { WUXING, WESTERN_ELEMENTS } from "@/lib/almanac";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

const PHASES = ["dream", "image", "divine", "voices", "dawn"] as const;

export default function DreamDetailPage() {
  const { t, locale } = useLocale();
  const tt = t.dream;
  const arc = t.home.arc; // 入夜·凝象·众声·问卜·拂晓
  const { user, loading, authedFetch } = useAuth();
  const id = String(useParams().id ?? "");

  const [dream, setDream] = useState<any>(null);
  const [reading, setReading] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [idx, setIdx] = useState(0);
  const [falling, setFalling] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const imgStarted = useRef(false);

  const load = useCallback(() => {
    authedFetch(`/api/dreams/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setDream(d.dream ?? null);
        setReading(d.reading ?? null);
      })
      .finally(() => setFetching(false));
  }, [authedFetch, id]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setFetching(false);
      return;
    }
    load();
  }, [user, loading, load]);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setReduce(true);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  const cast = reading?.cast;
  const tarot = reading?.tarot;
  const debate = reading?.debate;

  const runCastTarot = useCallback(async () => {
    setBusy(true);
    try {
      if (!reading?.cast) {
        const d = await authedFetch(`/api/dreams/${id}/cast`, { method: "POST" }).then((r) => r.json());
        if (d.cast) setReading((p: any) => ({ ...(p ?? {}), cast: d.cast }));
      }
      if (!reading?.tarot) {
        const d = await authedFetch(`/api/dreams/${id}/tarot`, { method: "POST" }).then((r) => r.json());
        if (d.tarot) setReading((p: any) => ({ ...(p ?? {}), tarot: d.tarot }));
      }
    } finally {
      setBusy(false);
    }
  }, [authedFetch, id, reading]);

  const runDebate = useCallback(async () => {
    if (reading?.debate) return;
    setBusy(true);
    try {
      const d = await authedFetch(`/api/dreams/${id}/debate?locale=${locale}`, { method: "POST" }).then((r) => r.json());
      if (d.debate) setReading((p: any) => ({ ...(p ?? {}), debate: d.debate }));
    } finally {
      setBusy(false);
    }
  }, [authedFetch, id, locale, reading]);

  const runImage = useCallback(async () => {
    if (imgStarted.current || dream?.painterlyProse) return;
    imgStarted.current = true;
    setImgBusy(true);
    try {
      const d = await authedFetch(`/api/dreams/${id}/image?locale=${locale}`, { method: "POST" }).then((r) => r.json());
      setDream((p: any) => (p ? { ...p, painterlyProse: d.painterlyProse ?? p.painterlyProse, imageUrl: d.imageUrl || p.imageUrl } : p));
    } finally {
      setImgBusy(false);
    }
  }, [authedFetch, id, locale, dream]);

  // start 凝象 generation early so it develops while you move through 入夜
  useEffect(() => {
    if (dream && !dream.painterlyProse) runImage();
  }, [dream, runImage]);

  // auto-run the phase's work as you fall into it
  useEffect(() => {
    if (!dream) return;
    const ph = PHASES[idx];
    if (ph === "divine" && (!reading?.cast || !reading?.tarot)) runCastTarot();
    if (ph === "voices" && !reading?.debate) runDebate();
  }, [idx, dream]);

  function go() {
    if (falling || idx >= PHASES.length - 1) return;
    if (reduce) {
      setIdx((i) => i + 1);
      return;
    }
    setFalling(true);
    window.setTimeout(() => {
      setIdx((i) => i + 1);
      setFalling(false);
    }, 660);
  }

  if (loading || fetching) return <p className="phase-label text-center py-16">{tt.loading}</p>;
  if (!user || !dream)
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-[var(--muted)]">{tt.notFound}</p>
        <a href="/journal" className="btn-veil inline-block">{tt.back}</a>
      </div>
    );

  const eb = dream.elementBaseline;
  const step = PHASES[idx];
  const elemKey = locale === "zh" ? eb?.wuxing?.key : eb?.western?.key;
  const elemColor =
    (locale === "zh" ? WUXING[eb?.wuxing?.key ?? ""]?.color : WESTERN_ELEMENTS[eb?.western?.key ?? ""]?.color) ?? "var(--moon)";
  const Advance = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center overflow-y-auto py-12">
      {children}
      {idx < PHASES.length - 1 && (
        <button
          onClick={go}
          aria-label={t.home.descend}
          className="elem-orb mt-2 transition-transform duration-500 hover:scale-110"
          style={{ ["--g" as string]: elemColor } as React.CSSProperties}
        >
          <ElementGlyph wuxing={elemKey} color={elemColor} size={46} />
        </button>
      )}
    </div>
  );

  return (
    <>
      {falling && <div aria-hidden className="fixed inset-0 z-30 yume-blackout" style={{ background: "#07060c" }} />}
      <div key={idx} className={`fixed inset-0 z-20 ${falling ? "yume-plunge" : "yume-surface"}`}>
        {/* 入夜 — the dream */}
        {step === "dream" && (
          <Advance>
            <p className="phase-label">{arc[0]} · {dream.date}</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {dream.imageryElements.map((s: string, i: number) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm" style={{ background: "rgba(179,166,239,0.12)", border: "1px solid var(--border)" }}>
                  <span className="sigil" style={{ width: "0.4rem", height: "0.4rem" }} />
                  {s}
                </span>
              ))}
            </div>
            {dream.question && <p className="text-xl text-[var(--mist)] max-w-xl">「{dream.question}」</p>}
            <div className="flex flex-wrap justify-center gap-4 text-xs text-[var(--muted)]">
              {dream.mood && <span>{tt.moodLabel} · {dream.mood}</span>}
              {eb && (
                <span className="elem-glow" style={{ color: elemColor }}>
                  {tt.baselineLabel} · {locale === "zh" ? `${eb.ganzhiDay} · ${eb.wuxing?.cn}` : `☉ ${eb.sun} · ${eb.western?.en}`}
                </span>
              )}
            </div>
            {dream.dreamText && <p className="text-[var(--muted)] leading-loose max-w-xl text-sm">{dream.dreamText}</p>}
          </Advance>
        )}

        {/* 凝象 — image (P5 placeholder) */}
        {step === "image" && (
          <Advance>
            <p className="phase-label">{arc[1]}</p>
            {dream.imageUrl ? (
              <div className="w-60 h-60 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dream.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : imgBusy ? (
              <ImageProgress wuxing={elemKey} color={elemColor} />
            ) : (
              <div className="w-60 h-60 rounded-2xl flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "radial-gradient(circle, rgba(179,166,239,0.08), transparent)" }}>
                <span className="text-[var(--muted)] text-xs tracking-[0.3em]">{dream.imageryElements.join(" · ")}</span>
              </div>
            )}
            {dream.painterlyProse && <p className="text-[var(--mist)] leading-loose max-w-lg text-sm">{dream.painterlyProse}</p>}
          </Advance>
        )}

        {/* 问卜 — 起卦 + 塔罗 */}
        {step === "divine" && (
          <Advance>
            <p className="phase-label">{arc[3]} · {tt.divineLabel}</p>
            {busy && !cast ? (
              <p className="text-[var(--muted)] animate-pulse">{tt.casting}</p>
            ) : cast ? (
              <div className="surface p-4 max-w-lg space-y-1 lens-divination text-left">
                <h3 className="text-lg">{cast.original.fullName}</h3>
                <p className="text-[var(--mist)] text-sm">{cast.original.guaCi}</p>
                {cast.changed && <p className="text-xs text-[var(--muted)]">{tt.changing} {cast.changingLines?.join("、")} → {tt.bianGua} {cast.changed.fullName}</p>}
              </div>
            ) : null}
            {tarot && (
              <div className="surface p-4 max-w-lg flex gap-4 lens-divination text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tarot.image} alt="" style={{ width: 80, borderRadius: 6, transform: tarot.orientation === "reversed" ? "rotate(180deg)" : "none" }} />
                <div className="space-y-1">
                  <p className="text-sm">{tarot.name_zh} <span className="text-xs" style={{ color: "var(--element)" }}>· {tarot.orientation === "upright" ? tt.upright : tt.reversed}</span></p>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{tarot.reading?.core}</p>
                </div>
              </div>
            )}
          </Advance>
        )}

        {/* 众声 — four-lens */}
        {step === "voices" && (
          <Advance>
            <p className="phase-label">{arc[2]} · {tt.voicesLabel}</p>
            {busy && !debate ? (
              <p className="text-[var(--muted)] animate-pulse">{tt.summoning}</p>
            ) : debate ? (
              <div className="space-y-2 max-w-lg w-full">
                {debate.views.map((v: any) => (
                  <div key={v.key} className="surface p-3 text-left" style={{ borderLeft: `2px solid var(${v.colorVar})` }}>
                    <span className="text-xs" style={{ color: `var(${v.colorVar})` }}>{locale === "zh" ? v.nameZh : v.nameEn}</span>
                    <p className="text-[var(--mist)] text-sm leading-relaxed">{v.statement || v.stance}</p>
                  </div>
                ))}
                {debate.note && <p className="text-xs text-[var(--muted)]">{debate.note}</p>}
              </div>
            ) : null}
          </Advance>
        )}

        {/* 拂晓 — synthesis */}
        {step === "dawn" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center overflow-y-auto py-12">
            <p className="phase-label">{arc[4]}</p>
            {debate?.synthesis ? (
              <div className="surface p-5 max-w-lg space-y-2 text-left" style={{ borderLeft: "2px solid var(--gold)" }}>
                <p><span className="text-xs text-[var(--muted)]">{tt.consensusLabel}　</span><span className="text-sm text-[var(--mist)]">{debate.synthesis.consensus}</span></p>
                <p><span className="text-xs text-[var(--muted)]">{tt.divergenceLabel}　</span><span className="text-sm text-[var(--mist)]">{debate.synthesis.divergence}</span></p>
                <p className="pt-1"><span className="text-xs" style={{ color: "var(--gold)" }}>{tt.guidanceLabel}　</span><span className="text-[var(--mist)]">{debate.synthesis.guidance}</span></p>
                {debate.synthesis.selfInquiry?.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-[var(--mist)] pt-1">
                    {debate.synthesis.selfInquiry.map((q: string, i: number) => <li key={i}>{q}</li>)}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-[var(--muted)] max-w-md leading-loose text-sm">{debate?.note ?? ""}</p>
            )}
            <p className="pt-2"><span className="text-[var(--gold)] tracking-[0.22em] text-lg">{t.home.invocation.maxim}</span></p>
            <a href="/journal" className="btn-veil inline-block mt-2">{tt.back}</a>
          </div>
        )}
      </div>
    </>
  );
}
