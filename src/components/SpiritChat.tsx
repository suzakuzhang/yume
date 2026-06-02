"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { SPIRITS } from "@/lib/debate/personas";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Msg {
  role: "user" | "spirit";
  content: string;
  spirit?: string;
  name?: string;
  colorVar?: string;
}

/**
 * 唤灵共话 — summon 1–3 spirits (梦之灵 / 卦灵 / 牌灵 / 四透镜) to keep talking
 * about this dream. One = 独对; two-three = 群聊, where they answer one another.
 */
export function SpiritChat({ dreamId, onClose }: { dreamId: string; onClose: () => void }) {
  const { t, locale } = useLocale();
  const s = t.dream.spirit;
  const { authedFetch } = useAuth();
  const [picked, setPicked] = useState<string[]>([]);
  const [autonomy, setAutonomy] = useState<"low" | "mid" | "high" | "manual">("mid");
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const nameOf = (sp: (typeof SPIRITS)[number]) => (locale === "zh" ? sp.nameZh : sp.nameEn);
  const group = picked.length > 1;
  // how many inter-spirit discussion rounds run automatically after you ask
  const DISCUSS_ROUNDS = { low: 1, mid: 2, high: 4, manual: 0 } as const;

  const scrollDown = () => requestAnimationFrame(() => scroller.current?.scrollTo({ top: 1e9, behavior: "smooth" }));

  function toggle(key: string) {
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length >= 3 ? p : [...p, key]));
  }

  async function callRound(history: Msg[], kind: "open" | "discuss" | "final"): Promise<Msg[]> {
    const payload = history.map((m) =>
      m.role === "user" ? { role: "user", content: m.content } : { role: "spirit", spirit: m.spirit, content: m.content }
    );
    const d = await authedFetch(`/api/dreams/${dreamId}/spirit?locale=${locale}`, {
      method: "POST",
      body: JSON.stringify({ roles: picked, messages: payload, roundKind: kind }),
    }).then((r) => r.json());
    return (d.replies ?? []).map((r: any) => ({ role: "spirit", content: r.content, spirit: r.spirit, name: r.name, colorVar: r.colorVar }));
  }

  // one human turn: spirits answer, then (in a group, non-manual) debate a few
  // rounds on their own and land on a 结论.
  async function runAuto(startHistory: Msg[]) {
    setBusy(true);
    try {
      let h = [...startHistory, ...(await callRound(startHistory, "open"))];
      setMsgs(h);
      scrollDown();
      if (group && autonomy !== "manual") {
        for (let i = 0; i < DISCUSS_ROUNDS[autonomy]; i++) {
          h = [...h, ...(await callRound(h, "discuss"))];
          setMsgs(h);
          scrollDown();
        }
        h = [...h, ...(await callRound(h, "final"))];
        setMsgs(h);
        scrollDown();
      }
    } finally {
      setBusy(false);
    }
  }

  // manual gear: one discussion round per press; jump in whenever you like
  async function discussOnce() {
    if (busy || !group) return;
    setBusy(true);
    try {
      const d = await callRound(msgs, "discuss");
      setMsgs((m) => [...m, ...d]);
      scrollDown();
    } finally {
      setBusy(false);
    }
  }

  function begin() {
    if (!picked.length) return;
    setStarted(true);
    // spirits just open; the back-and-forth begins once you ask
    (async () => {
      setBusy(true);
      try {
        const open = await callRound([], "open");
        setMsgs(open);
        scrollDown();
      } finally {
        setBusy(false);
      }
    })();
  }
  function send() {
    const text = input.trim();
    if (!text || busy) return;
    const h: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(h);
    setInput("");
    runAuto(h);
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex flex-col yume-surface"
      style={{ height: "100dvh", background: "rgba(7,6,12,0.96)", backdropFilter: "blur(6px)" }}
    >
      <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-[var(--border)] shrink-0">
        <span className="phase-label">{s.title}</span>
        <button onClick={onClose} className="text-xs tracking-[0.2em] text-[var(--muted)] hover:text-[var(--moon)]">{s.close} ✕</button>
      </div>

      {!started ? (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-6 px-6 py-8 text-center">
          <p className="text-[var(--mist)] max-w-sm leading-relaxed">{s.intro}</p>
          <div className="flex flex-wrap justify-center gap-3 max-w-md">
            {SPIRITS.map((sp) => {
              const on = picked.includes(sp.key);
              const c = `var(${sp.colorVar})`;
              return (
                <button
                  key={sp.key}
                  onClick={() => toggle(sp.key)}
                  className="px-4 py-2 rounded-full text-sm tracking-[0.12em] transition-all duration-300"
                  style={{
                    border: `1px solid ${on ? c : "var(--border)"}`,
                    color: on ? "#fff" : "var(--muted)",
                    background: on ? `color-mix(in srgb, ${c} 32%, transparent)` : "transparent",
                    boxShadow: on ? `0 0 14px -4px ${c}` : "none",
                  }}
                >
                  {nameOf(sp)}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--muted)] tracking-[0.18em]">
            {picked.length <= 1 ? s.single : s.group} · {picked.length}/3
          </p>
          {picked.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--muted)] tracking-[0.18em]">{s.freedom}</p>
              <div className="flex gap-2 justify-center">
                {(["low", "mid", "high", "manual"] as const).map((a) => {
                  const label = a === "low" ? s.autoLow : a === "mid" ? s.autoMid : a === "high" ? s.autoHigh : s.autoManual;
                  const on = autonomy === a;
                  return (
                    <button
                      key={a}
                      onClick={() => setAutonomy(a)}
                      className="px-3 py-1 rounded-full text-xs transition-all"
                      style={{ border: `1px solid ${on ? "var(--moon)" : "var(--border)"}`, color: on ? "var(--moon)" : "var(--muted)", boxShadow: on ? "0 0 14px -6px var(--moon)" : "none" }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[var(--muted)] max-w-xs mx-auto leading-relaxed">{s.autoHint}</p>
            </div>
          )}
          <button onClick={begin} disabled={!picked.length} className="btn-moon disabled:opacity-40">{s.start}</button>
        </div>
      ) : (
        <>
          <div ref={scroller} className="flex-1 overflow-y-auto px-5 py-6 space-y-4 max-w-2xl w-full mx-auto">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <span className="inline-block px-3 py-2 rounded-2xl rounded-br-sm text-sm max-w-[80%]" style={{ background: "rgba(179,166,239,0.16)", color: "var(--mist)" }}>
                    {m.content}
                  </span>
                </div>
              ) : (
                <div key={i} className="space-y-1">
                  <span className="text-xs tracking-[0.14em]" style={{ color: `var(${m.colorVar})` }}>{m.name}</span>
                  <p className="text-sm leading-relaxed text-[var(--mist)] pl-1" style={{ borderLeft: `2px solid var(${m.colorVar})`, paddingLeft: 10 }}>{m.content}</p>
                </div>
              )
            )}
            {busy && <p className="text-xs text-[var(--muted)] tracking-[0.3em] animate-pulse">{s.thinking}</p>}
          </div>
          <div className="border-t border-[var(--border)] px-3 sm:px-4 py-3 shrink-0" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
            {group && autonomy === "manual" && (
              <div className="flex justify-center mb-2">
                <button onClick={discussOnce} disabled={busy} className="btn-veil text-xs disabled:opacity-40">{s.discussBtn}</button>
              </div>
            )}
            <div className="flex items-end gap-2 max-w-2xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={s.placeholder}
                className="flex-1 min-w-0 resize-none px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-sm"
              />
              <button onClick={send} disabled={busy || !input.trim()} className="btn-moon shrink-0 px-4 py-2 disabled:opacity-40">{s.send}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
