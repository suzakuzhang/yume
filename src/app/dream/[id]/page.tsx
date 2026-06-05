"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { ElementGlyph } from "@/components/ElementGlyph";
import { ImageProgress } from "@/components/ImageProgress";
import { SpiritChat } from "@/components/SpiritChat";
import { VoicesStarMap } from "@/components/VoicesStarMap";
import { KeepDream } from "@/components/KeepDream";
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
  const [chat, setChat] = useState(false);
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
        const d = await authedFetch(`/api/dreams/${id}/cast?locale=${locale}`, { method: "POST" }).then((r) => r.json());
        if (d.cast) setReading((p: any) => ({ ...(p ?? {}), cast: d.cast }));
      }
      if (!reading?.tarot) {
        const d = await authedFetch(`/api/dreams/${id}/tarot?locale=${locale}`, { method: "POST" }).then((r) => r.json());
        if (d.tarot) setReading((p: any) => ({ ...(p ?? {}), tarot: d.tarot }));
      }
    } finally {
      setBusy(false);
    }
  }, [authedFetch, id, locale, reading]);

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
  // the gaze the compass drew today is the brightest star in 众声; the rest orbit, dim
  const leadGaze: string = dream.leadGaze || "";
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
              <div className="surface p-4 max-w-lg lens-divination text-left flex gap-4">
                {cast.coins && (
                  <div className="flex flex-col-reverse gap-1.5 shrink-0 pt-1" aria-hidden>
                    {cast.coins.map((ln: any) => (
                      <div key={ln.position} className="flex items-center gap-1.5">
                        <span className="flex justify-between items-center" style={{ width: 38 }}>
                          {ln.yang ? (
                            <span className="h-[5px] rounded-sm w-full" style={{ background: ln.changing ? "var(--gold)" : "var(--mist)" }} />
                          ) : (
                            <>
                              <span className="h-[5px] rounded-sm" style={{ width: "44%", background: ln.changing ? "var(--gold)" : "var(--mist)" }} />
                              <span className="h-[5px] rounded-sm" style={{ width: "44%", background: ln.changing ? "var(--gold)" : "var(--mist)" }} />
                            </>
                          )}
                        </span>
                        {ln.changing && <span className="text-[9px] text-[var(--gold)] leading-none">○</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="text-lg">{locale === "en" ? cast.original.name_en ?? cast.original.fullName : cast.original.fullName}</h3>
                  <p className="text-[var(--mist)] text-sm">{locale === "en" ? cast.original.judgment_en ?? cast.original.guaCi : cast.original.guaCi}</p>
                  {cast.changed && <p className="text-xs text-[var(--muted)]">{tt.changing} {cast.changingLines?.join(locale === "en" ? ", " : "、")} → {tt.bianGua} {locale === "en" ? cast.changed.name_en ?? cast.changed.fullName : cast.changed.fullName}</p>}
                  {cast.coins && <p className="text-[10px] text-[var(--muted)] tracking-[0.2em] pt-1">{tt.coinNote}</p>}
                </div>
              </div>
            ) : null}
            {tarot && (
              <div className="surface p-4 max-w-lg flex gap-4 lens-divination text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tarot.image} alt="" style={{ width: 80, borderRadius: 6, transform: tarot.orientation === "reversed" ? "rotate(180deg)" : "none" }} />
                <div className="space-y-1">
                  <p className="text-sm">{locale === "en" ? tarot.name_en : tarot.name_zh} <span className="text-xs" style={{ color: "var(--element)" }}>· {tarot.orientation === "upright" ? tt.upright : tt.reversed}</span></p>
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
              <>
                <ImageProgress wuxing={elemKey} color={elemColor} />
                <p className="text-[var(--muted)] text-xs tracking-[0.3em] animate-pulse">{tt.summoning}</p>
              </>
            ) : debate ? (
              <div className="w-full flex flex-col items-center gap-3">
                <VoicesStarMap
                  views={debate.views}
                  cast={cast}
                  tarot={tarot}
                  imageUrl={dream.imageUrl}
                  painterly={dream.painterlyProse}
                  imagery={dream.imageryElements}
                  leadGaze={leadGaze}
                  locale={locale}
                  leadLabel={tt.leadLabel}
                />
                {debate.note && <p className="text-xs text-[var(--muted)] max-w-lg text-center">{debate.note}</p>}
              </div>
            ) : null}
          </Advance>
        )}

        {/* 拂晓 — synthesis */}
        {step === "dawn" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center overflow-y-auto py-12">
            <p className="phase-label">{arc[4]}</p>
            {debate?.synthesis?.guidance && (
              <p className="text-lg md:text-xl leading-relaxed max-w-lg text-[var(--gold)] glow">{debate.synthesis.guidance}</p>
            )}
            <KeepDream
              dreamId={id}
              initiallyKept={!!dream.labConsent}
              anon={!!user?.anon}
              username={user?.username ?? ""}
              color={elemColor}
            />
            <button
              onClick={() => setChat(true)}
              className="mt-3 flex flex-col items-center gap-2 group"
              aria-label={tt.spirit.enter}
            >
              <span
                className="elem-orb inline-flex items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-110"
                style={{ ["--g" as string]: elemColor, width: 72, height: 72, border: `1px solid ${elemColor}` } as React.CSSProperties}
              >
                <ElementGlyph wuxing={elemKey} color={elemColor} size={40} />
              </span>
              <span className="text-xs tracking-[0.3em] text-[var(--muted)] group-hover:text-[var(--moon)] transition-colors">{tt.spirit.enter}</span>
            </button>
            <a href="/journal" className="text-xs tracking-[0.3em] text-[var(--muted)] hover:text-[var(--moon)] mt-1">{tt.back}</a>
          </div>
        )}
      </div>
      {chat && <SpiritChat dreamId={id} onClose={() => setChat(false)} />}
    </>
  );
}
