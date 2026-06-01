"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";

interface DreamRow {
  id: string;
  date: string;
  imageryElements: string[];
  question: string;
  mood: string;
  createdAt: string;
  hasReading: boolean;
}
interface Tally { label: string; count: number; color?: string }
interface Timeline {
  count: number;
  from: string;
  to: string;
  recurrentImagery: Tally[];
  moods: Tally[];
  wuxing: Tally[];
  western: Tally[];
  recurrentSymbols: { symbol: string; count: number }[];
}

function Chips({ items, withColor }: { items: Tally[]; withColor?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {items.map((t, i) => (
        <span
          key={i}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs"
          style={{ background: "rgba(179,166,239,0.1)", border: `1px solid ${withColor && t.color ? t.color : "var(--border)"}` }}
        >
          {withColor && t.color && <span className="sigil" style={{ width: "0.35rem", height: "0.35rem", background: t.color, boxShadow: `0 0 8px 1px ${t.color}` }} />}
          {t.label}
          <span className="text-[var(--muted)]">×{t.count}</span>
        </span>
      ))}
    </div>
  );
}

export default function JournalPage() {
  const { t, locale } = useLocale();
  const tt = t.journal;
  const { user, loading, authedFetch } = useAuth();
  const [dreams, setDreams] = useState<DreamRow[]>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [narrative, setNarrative] = useState("");
  const [narrating, setNarrating] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setFetching(false);
      return;
    }
    Promise.all([
      authedFetch("/api/dreams").then((r) => r.json()),
      authedFetch("/api/longitudinal").then((r) => r.json()),
    ])
      .then(([d, l]) => {
        setDreams(d.items ?? []);
        setTimeline(l.timeline ?? null);
      })
      .finally(() => setFetching(false));
  }, [user, loading, authedFetch]);

  async function runNarrative() {
    setNarrating(true);
    try {
      const r = await authedFetch(`/api/longitudinal?locale=${locale}`, { method: "POST" });
      const d = await r.json();
      setNarrative(d.narrative ?? "");
      if (d.timeline) setTimeline(d.timeline);
    } finally {
      setNarrating(false);
    }
  }

  if (loading || fetching) return <p className="veil phase-label text-center py-16">{tt.loading}</p>;

  if (!user) {
    return (
      <div className="veil space-y-4 text-center py-10">
        <p className="phase-label">{tt.label}</p>
        <p className="text-[var(--muted)]">
          {tt.mustLoginPre}{" "}
          <a href="/login" className="text-[var(--accent)]">{tt.mustLoginLink}</a>
          {tt.mustLoginPost}
        </p>
      </div>
    );
  }

  const elements = locale === "zh" ? timeline?.wuxing : timeline?.western;

  return (
    <div className="veil space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="phase-label">{tt.label}</p>
          <h1 className="text-2xl">{tt.title}</h1>
        </div>
        <a href="/today" className="btn-moon text-sm">{tt.newDream}</a>
      </div>

      {/* 纵向 longitudinal panel */}
      {timeline && timeline.count >= 2 && (
        <div className="surface p-5 space-y-4 text-center">
          <p className="phase-label">{tt.longLabel}　{timeline.from} — {timeline.to} · {timeline.count}</p>
          {timeline.recurrentImagery.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-[var(--muted)]">{tt.recurrentImageryLabel}</p>
              <Chips items={timeline.recurrentImagery} />
            </div>
          )}
          {timeline.recurrentSymbols.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-[var(--muted)]">{tt.recurrentSymbolsLabel}</p>
              <Chips items={timeline.recurrentSymbols.map((s) => ({ label: s.symbol, count: s.count }))} />
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-6">
            {timeline.moods.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-[var(--muted)]">{tt.moodsLabel}</p>
                <Chips items={timeline.moods} />
              </div>
            )}
            {elements && elements.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-[var(--muted)]">{tt.elementsLabel}</p>
                <Chips items={elements} withColor />
              </div>
            )}
          </div>

          {narrative ? (
            <p className="text-[var(--mist)] leading-loose text-left pt-2 border-t border-[var(--border)]">{narrative}</p>
          ) : (
            <button onClick={runNarrative} disabled={narrating} className="btn-veil disabled:opacity-50">
              {narrating ? tt.narrativeReading : tt.narrativeBtn}
            </button>
          )}
        </div>
      )}

      {dreams.length === 0 ? (
        <p className="text-[var(--muted)] py-10 text-center">{tt.empty}</p>
      ) : (
        <ul className="space-y-3">
          {dreams.map((d) => (
            <li key={d.id}>
              <a href={`/dream/${d.id}`} className="block surface p-4 hover:border-[var(--accent)] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">{d.date}</span>
                  {d.hasReading && <span className="text-xs text-[var(--accent)]">{tt.hasReading}</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.imageryElements.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(179,166,239,0.12)", border: "1px solid var(--border)" }}>
                      <span className="sigil" style={{ width: "0.35rem", height: "0.35rem" }} />
                      {s}
                    </span>
                  ))}
                </div>
                {d.question && (
                  <p className="mt-2 text-sm text-[var(--foreground)]">
                    {tt.askPrefix}
                    {d.question}
                  </p>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
