"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { almanac } from "@/lib/almanac";
import { LEAD_GAZE_KEY } from "@/components/GazeCompass";
import { IdEntry } from "@/components/IdEntry";
import type { ElementBaseline } from "@/lib/store/types";

export default function TodayPage() {
  const { t } = useLocale();
  const tt = t.today;
  const { user, loading, authedFetch } = useAuth();
  const router = useRouter();

  const [imagery, setImagery] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [dreamText, setDreamText] = useState("");
  const [question, setQuestion] = useState("");
  const [mood, setMood] = useState("");
  const [moodDraft, setMoodDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function addImagery(raw: string) {
    const v = raw.trim();
    if (!v) return;
    if (!imagery.includes(v) && imagery.length < 12) setImagery([...imagery, v]);
    setDraft("");
  }
  function onDraftKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addImagery(draft);
    } else if (e.key === "Backspace" && !draft && imagery.length) {
      setImagery(imagery.slice(0, -1));
    }
  }

  async function submit() {
    setError("");
    if (imagery.length === 0) {
      setError(tt.imageryEmpty);
      return;
    }
    setBusy(true);
    try {
      // capture the moment's elemental ground note as a reading baseline
      const a = almanac(new Date());
      const elementBaseline: ElementBaseline = {
        ganzhiDay: a.day.text,
        ganzhiYear: a.year.text,
        ganzhiHour: a.hour.text,
        wuxing: { key: a.wuxing.key, cn: a.wuxing.cn, imagery: a.wuxing.imagery },
        western: { key: a.western.key, en: a.western.en, imagery: a.western.imagery },
        sun: a.sun.en,
        four: a.four.cn,
        capturedAt: new Date().toISOString(),
      };
      // today's compass draw, if any — becomes this dream's 主线
      let leadGaze = "";
      try {
        const raw = localStorage.getItem(LEAD_GAZE_KEY);
        if (raw) leadGaze = JSON.parse(raw).gaze ?? "";
      } catch {
        /* ignore */
      }
      const res = await authedFetch("/api/dreams", {
        method: "POST",
        body: JSON.stringify({ imageryElements: imagery, dreamText, question, mood, leadGaze, elementBaseline }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      router.push(`/dream/${data.dream.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (loading) return <p className="veil phase-label text-center py-16">{tt.submitting}</p>;

  // identity is captured right here, at the moment of recording — no bounce to a separate gate
  if (!user) {
    return (
      <div className="veil max-w-sm mx-auto py-10 space-y-6">
        <div className="text-center space-y-2">
          <p className="phase-label">{tt.label}</p>
          <h1 className="text-2xl tracking-[0.08em]">{tt.title}</h1>
          <p className="text-sm text-[var(--muted)] leading-loose pt-1">{tt.idIntro}</p>
        </div>
        <IdEntry />
      </div>
    );
  }

  return (
    <div className="veil max-w-xl mx-auto space-y-10">
      <header className="text-center space-y-2">
        <p className="phase-label">{tt.label}</p>
        <h1 className="text-3xl tracking-[0.08em]">{tt.title}</h1>
        <p className="text-sm text-[var(--muted)] leading-loose pt-1">{tt.intro}</p>
      </header>

      {/* imagery — stars lit one by one */}
      <section className="space-y-3">
        <label className="phase-label block">{tt.imageryLabel}</label>
        <div className="surface px-4 py-3 flex flex-wrap items-center gap-2 min-h-[3.5rem]">
          {imagery.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-sm"
              style={{ background: "rgba(179,166,239,0.12)", border: "1px solid var(--border)" }}
            >
              <span className="sigil" style={{ width: "0.4rem", height: "0.4rem" }} />
              <span>{s}</span>
              <button
                onClick={() => setImagery(imagery.filter((x) => x !== s))}
                className="px-1 text-[var(--muted)] hover:text-[var(--moon)]"
                aria-label="remove"
              >
                ×
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onDraftKey}
            onBlur={() => addImagery(draft)}
            placeholder={imagery.length ? "" : tt.imageryPh}
            className="flex-1 min-w-[8rem] bg-transparent outline-none py-1"
          />
        </div>
        <p className="text-xs text-[var(--muted)]">{tt.imageryHelp}</p>
      </section>

      {/* the shape of the dream */}
      <section className="space-y-2">
        <label className="phase-label block">{tt.dreamLabel}</label>
        <textarea
          value={dreamText}
          onChange={(e) => setDreamText(e.target.value)}
          placeholder={tt.dreamPh}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)] leading-loose resize-none"
        />
        <p className="text-xs text-[var(--muted)]">{tt.dreamHelp}</p>
      </section>

      {/* the question */}
      <section className="space-y-2">
        <label className="phase-label block">{tt.questionLabel}</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={tt.questionPh}
          className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
        />
      </section>

      {/* mood — like mixing a color */}
      <section className="space-y-3">
        <label className="phase-label block">{tt.moodLabel}</label>
        <div className="flex flex-wrap items-center gap-2">
          {tt.moods.map((m) => {
            const on = mood === m;
            return (
              <button
                key={m}
                onClick={() => setMood(on ? "" : m)}
                className="px-3 py-1.5 rounded-full text-sm transition-all"
                style={{
                  border: `1px solid ${on ? "var(--moon)" : "var(--border)"}`,
                  color: on ? "var(--moon)" : "var(--muted)",
                  boxShadow: on ? "0 0 18px -6px var(--moon)" : "none",
                }}
              >
                {m}
              </button>
            );
          })}
          {/* a custom mood the dreamer typed */}
          {mood && !tt.moods.includes(mood) && (
            <button
              onClick={() => setMood("")}
              className="px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5"
              style={{ border: "1px solid var(--moon)", color: "var(--moon)", boxShadow: "0 0 18px -6px var(--moon)" }}
            >
              {mood} <span className="opacity-70">×</span>
            </button>
          )}
          <input
            value={moodDraft}
            onChange={(e) => setMoodDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const v = moodDraft.trim();
                if (v) setMood(v);
                setMoodDraft("");
              }
            }}
            onBlur={() => {
              const v = moodDraft.trim();
              if (v) setMood(v);
              setMoodDraft("");
            }}
            placeholder={tt.moodCustomPh}
            className="min-w-[7rem] flex-1 bg-transparent outline-none text-sm py-1.5 px-1 text-[var(--mist)] placeholder:text-[var(--muted)]"
          />
        </div>
      </section>

      {error && <p className="text-sm text-[#e08aa0] text-center">{error}</p>}

      <div className="flex items-center justify-center gap-4 pt-2">
        <button onClick={submit} disabled={busy} className="btn-moon disabled:opacity-50">
          {busy ? tt.submitting : tt.submit}
        </button>
        <a href="/journal" className="btn-veil">
          {tt.backToTimeline}
        </a>
      </div>
    </div>
  );
}
