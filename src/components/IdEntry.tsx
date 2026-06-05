"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

const ID_RE = /^[A-Za-z0-9]{1,18}$/;

/**
 * Passwordless id entry — type the id you left at 拂晓 to retrace your kept dreams.
 * No invite code, no birth date. Used on /diary.
 */
export function IdEntry({ onDone }: { onDone?: () => void }) {
  const { t } = useLocale();
  const tt = t.entry;
  const { enter } = useAuth();
  const [id, setId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!ID_RE.test(id.trim())) {
      setError(tt.idError);
      return;
    }
    setBusy(true);
    try {
      await enter(id.trim());
      onDone?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm mx-auto">
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
      {error && <p className="text-sm text-[#e08aa0]">{error}</p>}
      <button type="submit" disabled={busy} className="btn-moon w-full disabled:opacity-50">
        {busy ? tt.submitting : tt.submit}
      </button>
    </form>
  );
}
