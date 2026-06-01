"use client";

import { useCallback, useEffect, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
const KEY = "yume_admin";

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"invites" | "users" | "logs">("invites");
  const [error, setError] = useState("");

  const [invites, setInvites] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<"quota" | "whitelist">("quota");
  const [newMax, setNewMax] = useState(10);
  const [newLabel, setNewLabel] = useState("");

  const adminFetch = useCallback(
    (path: string, init: RequestInit = {}) => {
      const c = code || (typeof window !== "undefined" ? localStorage.getItem(KEY) ?? "" : "");
      const headers = new Headers(init.headers);
      headers.set("X-Admin-Code", c);
      if (init.body) headers.set("Content-Type", "application/json");
      return fetch(path, { ...init, headers });
    },
    [code]
  );

  const loadAll = useCallback(async () => {
    const [i, u, l] = await Promise.all([
      adminFetch("/api/admin/invite-codes").then((r) => r.json()),
      adminFetch("/api/admin/users").then((r) => r.json()),
      adminFetch("/api/admin/logs?limit=100").then((r) => r.json()),
    ]);
    setInvites(i.items ?? []);
    setUsers(u.items ?? []);
    setLogs(l.logs ?? []);
  }, [adminFetch]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (saved) {
      setCode(saved);
      fetch("/api/admin/invite-codes", { headers: { "X-Admin-Code": saved } }).then((r) => {
        if (r.ok) {
          setAuthed(true);
          r.json().then((d) => setInvites(d.items ?? []));
        } else localStorage.removeItem(KEY);
      });
    }
  }, []);

  useEffect(() => {
    if (authed) loadAll();
  }, [authed, loadAll]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/admin/invite-codes", { headers: { "X-Admin-Code": code } });
    if (r.ok) {
      localStorage.setItem(KEY, code);
      setAuthed(true);
    } else setError("管理口令错误（环境变量 YUME_ADMIN_CODE）");
  }

  async function createInvite() {
    await adminFetch("/api/admin/invite-codes", {
      method: "POST",
      body: JSON.stringify({ action: "create", code: newCode || undefined, type: newType, maxUses: newMax, label: newLabel }),
    });
    setNewCode("");
    setNewLabel("");
    loadAll();
  }
  async function inviteAction(action: string, c: string, extra: any = {}) {
    await adminFetch("/api/admin/invite-codes", { method: "POST", body: JSON.stringify({ action, code: c, ...extra }) });
    loadAll();
  }

  if (!authed) {
    return (
      <form onSubmit={signIn} className="veil max-w-sm mx-auto space-y-4 py-10">
        <p className="phase-label text-center">admin · 管理</p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="管理口令"
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
        />
        {error && <p className="text-sm text-[#e08aa0]">{error}</p>}
        <button className="btn-moon w-full">进入</button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {(["invites", "users", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm tracking-[0.2em] ${tab === t ? "text-[var(--moon)]" : "text-[var(--muted)]"}`}
          >
            {t === "invites" ? "邀请码" : t === "users" ? "用户" : "日志"}
          </button>
        ))}
      </div>

      {tab === "invites" && (
        <div className="space-y-4">
          <div className="surface p-4 flex flex-wrap gap-2 items-end text-sm">
            <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="码(可空)" className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border)] w-28" />
            <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border)]" style={{ background: "#1a1730" }}>
              <option value="quota">限次</option>
              <option value="whitelist">白名单</option>
            </select>
            <input type="number" value={newMax} onChange={(e) => setNewMax(Number(e.target.value))} className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border)] w-16" />
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="备注" className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border)] w-28" />
            <button onClick={createInvite} className="btn-veil text-xs">新建</button>
          </div>
          <ul className="space-y-2 text-sm">
            {invites.map((c) => (
              <li key={c.code} className="surface p-3 flex items-center gap-3">
                <span className="font-mono text-[var(--mist)]">{c.code}</span>
                <span className="text-[var(--muted)] text-xs">{c.type} · {c.usedCount}/{c.type === "whitelist" ? "∞" : c.maxUses} · {c.label}</span>
                <span className={`text-xs ${c.isActive ? "text-[var(--lens-divination)]" : "text-[var(--muted)]"}`}>{c.isActive ? "启用" : "停用"}</span>
                <span className="ml-auto flex gap-2">
                  <button onClick={() => inviteAction("toggle", c.code, { isActive: !c.isActive })} className="text-xs text-[var(--muted)] hover:text-[var(--moon)]">{c.isActive ? "停用" : "启用"}</button>
                  <button onClick={() => inviteAction("delete", c.code)} className="text-xs text-[#e08aa0]">删</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "users" && (
        <ul className="space-y-2 text-sm">
          {users.map((u) => (
            <li key={u.id} className="surface p-3 flex items-center gap-3">
              <span className="text-[var(--mist)]">{u.username}</span>
              <span className="text-xs text-[var(--muted)]">{u.role} · {u.inviteCodeUsed} · {u.createdAt.slice(0, 10)}</span>
            </li>
          ))}
          {users.length === 0 && <li className="text-[var(--muted)] text-sm">暂无用户</li>}
        </ul>
      )}

      {tab === "logs" && (
        <ul className="space-y-1.5 text-xs font-mono">
          {logs.map((l) => (
            <li key={l.id} className="flex gap-3 text-[var(--muted)]">
              <span>{l.timestamp.slice(5, 16).replace("T", " ")}</span>
              <span className="text-[var(--moon)]">{l.action}</span>
              <span className="truncate">{l.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
