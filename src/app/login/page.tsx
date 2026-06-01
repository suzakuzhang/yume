"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";

export default function LoginPage() {
  const { t } = useLocale();
  const tt = t.login;
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
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
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-[var(--muted)]">{tt.username}</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-[var(--muted)]">{tt.password}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
          />
        </label>
        {error && <p className="text-sm text-[#e08aa0]">{error}</p>}
        <button type="submit" disabled={busy} className="btn-moon w-full disabled:opacity-50">
          {busy ? tt.submitting : tt.submit}
        </button>
      </form>
      <p className="text-sm text-[var(--muted)] text-center">
        {tt.noAccount}
        <a href="/register" className="text-[var(--accent)] ml-1">
          {tt.toRegister}
        </a>
      </p>
    </div>
  );
}
