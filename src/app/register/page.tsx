"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";

export default function RegisterPage() {
  const { t } = useLocale();
  const tt = t.register;
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [requireInvite, setRequireInvite] = useState(true);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setRequireInvite(!!d.requireInvite))
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(username, password, inviteCode);
      router.push("/journal");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="veil max-w-sm mx-auto space-y-6">
      <div className="space-y-1 text-center">
        <p className="phase-label">{tt.label}</p>
        <h1 className="text-2xl">{tt.title}</h1>
      </div>
      <p className="text-sm text-[var(--muted)] text-center">{tt.sub}</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label={tt.username} value={username} onChange={setUsername} placeholder={tt.usernamePh} />
        <Field
          label={tt.password}
          value={password}
          onChange={setPassword}
          type="password"
          placeholder={tt.passwordPh}
        />
        <Field
          label={requireInvite ? tt.invite : tt.inviteOptional}
          value={inviteCode}
          onChange={setInviteCode}
          placeholder={tt.invitePh}
        />
        {!requireInvite && <p className="text-xs text-[var(--moon-soft)]">{tt.betaNote}</p>}
        {error && <p className="text-sm text-[#e08aa0]">{error}</p>}
        <button type="submit" disabled={busy} className="btn-moon w-full disabled:opacity-50">
          {busy ? tt.submitting : tt.submit}
        </button>
      </form>
      <p className="text-sm text-[var(--muted)] text-center">
        {tt.haveAccount}
        <a href="/login" className="text-[var(--accent)] ml-1">
          {tt.signin}
        </a>
      </p>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-[var(--muted)]">{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}
