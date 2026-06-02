"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";

const ID_RE = /^[A-Za-z0-9]{1,18}$/;

export default function EnterPage() {
  const { t } = useLocale();
  const tt = t.entry;
  const { enter } = useAuth();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [id, setId] = useState("");
  const [requireInvite, setRequireInvite] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setRequireInvite(!!d.requireInvite))
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
      await enter(inviteCode.trim(), id.trim());
      router.push("/today");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="veil max-w-sm mx-auto space-y-6 py-6">
      <div className="space-y-1 text-center">
        <p className="phase-label">{tt.label}</p>
        <h1 className="text-2xl">{tt.title}</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-[var(--muted)]">{requireInvite ? tt.invite : `${tt.invite}（${tt.betaNote}）`}</span>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder={tt.invitePh}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
          />
        </label>
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
    </div>
  );
}
