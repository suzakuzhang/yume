"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";

const ID_RE = /^[A-Za-z0-9]{1,18}$/;

/**
 * 拂晓 keep decision. A dream is recorded anonymously; here the dreamer decides
 * its fate: leave an id (kept + retrievable via /diary), keep anonymously (in the
 * library, no id), or let it go (deleted, spans and all). Re-asks gently before
 * offering the discard.
 */
export function KeepDream({
  dreamId,
  initiallyKept,
  anon,
  username,
  color,
}: {
  dreamId: string;
  initiallyKept: boolean;
  anon: boolean;
  username: string;
  color: string;
}) {
  const { t } = useLocale();
  const k = t.dream.keep;
  const { keep, authedFetch } = useAuth();
  const router = useRouter();

  const [stage, setStage] = useState<"ask" | "reask" | "done">(initiallyKept ? "done" : "ask");
  const [mode, setMode] = useState<"named" | "anon">(initiallyKept && !anon ? "named" : "anon");
  const [keptName, setKeptName] = useState(initiallyKept && !anon ? username : "");
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function claim() {
    setError("");
    if (!ID_RE.test(id.trim())) {
      setError(k.idPh);
      return;
    }
    setBusy(true);
    try {
      const r = await keep(dreamId, { id: id.trim() });
      setKeptName(r.user?.username ?? id.trim());
      setMode("named");
      setStage("done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function keepAnon() {
    setBusy(true);
    try {
      await keep(dreamId);
      setMode("anon");
      setStage("done");
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    setBusy(true);
    try {
      await authedFetch(`/api/dreams/${dreamId}`, { method: "DELETE" });
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "done") {
    return (
      <div className="surface p-4 max-w-md text-center space-y-1" style={{ borderColor: color }}>
        <p className="text-sm text-[var(--mist)] leading-relaxed">{mode === "named" ? k.doneNamed : k.doneAnon}</p>
        {mode === "named" && keptName && (
          <p className="text-xs tracking-[0.2em]" style={{ color: "var(--gold)" }}>ID · {keptName}　/diary</p>
        )}
      </div>
    );
  }

  if (stage === "reask") {
    return (
      <div className="surface p-4 max-w-md text-center space-y-3">
        <div className="space-y-1">
          <p className="text-sm text-[var(--mist)]">{k.reaskTitle}</p>
          <p className="text-xs text-[var(--muted)]">{k.reaskSub}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => setStage("ask")} disabled={busy} className="btn-moon disabled:opacity-50">{k.againId}</button>
          <button onClick={keepAnon} disabled={busy} className="btn-veil disabled:opacity-50">{k.anonKeep}</button>
          <button onClick={discard} disabled={busy} className="text-xs tracking-[0.2em] text-[var(--muted)] hover:text-[#e08aa0]">{k.discard}</button>
        </div>
      </div>
    );
  }

  // stage "ask"
  return (
    <div className="surface p-4 max-w-md text-center space-y-3">
      <div className="space-y-1">
        <p className="text-sm text-[var(--mist)]">{k.prompt}</p>
        <p className="text-xs text-[var(--muted)]">{k.promptSub}</p>
      </div>
      <input
        value={id}
        onChange={(e) => setId(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 18))}
        placeholder={k.idPh}
        maxLength={18}
        onKeyDown={(e) => e.key === "Enter" && claim()}
        className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)] tracking-wide text-center"
      />
      {error && <p className="text-xs text-[#e08aa0]">{error}</p>}
      <div className="flex items-center justify-center gap-4">
        <button onClick={claim} disabled={busy} className="btn-moon disabled:opacity-50">{busy ? k.saving : k.keepBtn}</button>
        <button onClick={() => setStage("reask")} disabled={busy} className="text-xs tracking-[0.2em] text-[var(--muted)] hover:text-[var(--moon)]">{k.notNow}</button>
      </div>
    </div>
  );
}
