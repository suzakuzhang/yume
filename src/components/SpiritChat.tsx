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
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const nameOf = (sp: (typeof SPIRITS)[number]) => (locale === "zh" ? sp.nameZh : sp.nameEn);
  const group = picked.length > 1;

  function toggle(key: string) {
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length >= 3 ? p : [...p, key]));
  }

  async function runTurn(history: Msg[]) {
    setBusy(true);
    try {
      const payload = history.map((m) =>
        m.role === "user" ? { role: "user", content: m.content } : { role: "spirit", spirit: m.spirit, content: m.content }
      );
      const d = await authedFetch(`/api/dreams/${dreamId}/spirit?locale=${locale}`, {
        method: "POST",
        body: JSON.stringify({ roles: picked, messages: payload }),
      }).then((r) => r.json());
      const replies: Msg[] = (d.replies ?? []).map((r: any) => ({ role: "spirit", content: r.content, spirit: r.spirit, name: r.name, colorVar: r.colorVar }));
      setMsgs([...history, ...replies]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scroller.current?.scrollTo({ top: 1e9, behavior: "smooth" }));
    }
  }

  function begin() {
    if (!picked.length) return;
    setStarted(true);
    runTurn([]); // spirits open the conversation
  }
  function send() {
    const text = input.trim();
    if (!text || busy) return;
    const h: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(h);
    setInput("");
    runTurn(h);
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col yume-surface" style={{ background: "rgba(7,6,12,0.96)", backdropFilter: "blur(6px)" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <span className="phase-label">{s.title}</span>
        <button onClick={onClose} className="text-xs tracking-[0.2em] text-[var(--muted)] hover:text-[var(--moon)]">{s.close} ✕</button>
      </div>

      {!started ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-7 px-6 text-center">
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
          <div className="border-t border-[var(--border)] px-4 py-3">
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
                className="flex-1 resize-none px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-sm"
              />
              <button onClick={send} disabled={busy || !input.trim()} className="btn-moon px-4 py-2 disabled:opacity-40">{s.send}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
