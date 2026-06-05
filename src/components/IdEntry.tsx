"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

const ID_RE = /^[A-Za-z0-9]{1,18}$/;
const THIS_YEAR = new Date().getFullYear();

/**
 * Passwordless id-entry — write your id (+ optional birth date) and drift in. The
 * invite-code box appears only when an admin has locked the beta down. Shared by
 * the /login screen and inlined on the recording page so identity is captured at
 * the moment you go to keep a dream.
 */
export function IdEntry({ onDone, compact }: { onDone?: () => void; compact?: boolean }) {
  const { t, locale } = useLocale();
  const tt = t.entry;
  const { enter } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [id, setId] = useState("");
  const [needInvite, setNeedInvite] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // birth as three dropdowns → composed into YYYY-MM-DD
  const [by, setBy] = useState("");
  const [bm, setBm] = useState("");
  const [bd, setBd] = useState("");
  const years = useMemo(() => Array.from({ length: THIS_YEAR - 1900 + 1 }, (_, i) => THIS_YEAR - i), []);
  const daysInMonth = by && bm ? new Date(Number(by), Number(bm), 0).getDate() : 31;
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const birth = by && bm && bd ? `${by}-${String(bm).padStart(2, "0")}-${String(bd).padStart(2, "0")}` : "";

  // if the chosen day no longer fits the month (e.g. 31 → Feb), drop it
  useEffect(() => {
    if (bd && Number(bd) > daysInMonth) setBd("");
  }, [bd, daysInMonth]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setNeedInvite(!!d.requireInvite))
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!ID_RE.test(id.trim())) {
      setError(tt.idError);
      return;
    }
    setBusy(true);
    try {
      await enter(inviteCode.trim(), id.trim(), birth.trim());
      onDone?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`space-y-4 ${compact ? "max-w-sm mx-auto" : ""}`}>
      {needInvite && (
        <label className="block space-y-1">
          <span className="text-sm text-[var(--muted)]">{tt.invite}</span>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder={tt.invitePh}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
          />
        </label>
      )}
      <label className="block space-y-1">
        <span className="text-sm text-[var(--muted)]">{tt.id}</span>
        <input
          value={id}
          onChange={(e) => setId(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 18))}
          placeholder={tt.idPh}
          maxLength={18}
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)] tracking-wide"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-[var(--muted)]">{tt.birth}</span>
        <div className="flex gap-2">
          <select
            value={by}
            onChange={(e) => setBy(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-[var(--mist)]"
          >
            <option value="">{locale === "zh" ? "年" : "Year"}</option>
            {years.map((y) => (
              <option key={y} value={y} style={{ background: "#1a1730" }}>{y}</option>
            ))}
          </select>
          <select
            value={bm}
            onChange={(e) => setBm(e.target.value)}
            className="w-24 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-[var(--mist)]"
          >
            <option value="">{locale === "zh" ? "月" : "Mon"}</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m} style={{ background: "#1a1730" }}>{m}</option>
            ))}
          </select>
          <select
            value={bd}
            onChange={(e) => setBd(e.target.value)}
            className="w-24 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)] text-[var(--mist)]"
          >
            <option value="">{locale === "zh" ? "日" : "Day"}</option>
            {days.map((d) => (
              <option key={d} value={d} style={{ background: "#1a1730" }}>{d}</option>
            ))}
          </select>
        </div>
        <span className="text-[11px] text-[var(--muted)]">{tt.birthNote}</span>
      </label>
      {error && <p className="text-sm text-[#e08aa0]">{error}</p>}
      <button type="submit" disabled={busy} className="btn-moon w-full disabled:opacity-50">
        {busy ? tt.submitting : tt.submit}
      </button>
    </form>
  );
}
