/**
 * The yume storage API — JSON-on-disk backend (pure JS, zero native deps).
 *
 * Business code depends only on these exported functions, never on the file
 * format. To move to SQLite/Postgres for production, reimplement these same
 * signatures against another backend (a better-sqlite3 reference impl is kept at
 * db.sqlite.bak) — callers are unaffected.
 *
 * Persistence: one JSON file at ${DATA_DIR}/yume_data.json (DATA_DIR env,
 * default ./data). On Render, mount a persistent disk and set DATA_DIR to it so
 * the journal survives deploys/restarts. Server-only.
 */
import fs from "fs";
import path from "path";
import type {
  AccessSession,
  Dream,
  InviteCode,
  Reading,
  Role,
  UsageLog,
  User,
} from "./types";

export * from "./types";

const DATA_DIR = process.env.DATA_DIR?.trim() || path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "yume_data.json");

export interface RuntimeConfig {
  /** admin override for invite gating; undefined → fall back to env YUME_REQUIRE_INVITE. */
  requireInvite?: boolean;
}

interface DataStore {
  users: User[];
  sessions: Record<string, AccessSession>;
  inviteCodes: InviteCode[];
  usageLogs: UsageLog[];
  dreams: Dream[];
  readings: Reading[];
  config: RuntimeConfig;
}

const EMPTY: DataStore = {
  users: [],
  sessions: {},
  inviteCodes: [],
  usageLogs: [],
  dreams: [],
  readings: [],
  config: {},
};

/** default per-user dream capacity when none is set on the account. */
export const DEFAULT_QUOTA = 100;

// Cached on globalThis to survive Next.js dev hot-reload.
const g = globalThis as unknown as { __yumeStore?: DataStore };

function load(): DataStore {
  if (g.__yumeStore) return g.__yumeStore;
  let data: DataStore;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      data = { ...EMPTY, ...parsed };
    } else {
      data = structuredClone(EMPTY);
    }
  } catch {
    data = structuredClone(EMPTY);
  }
  g.__yumeStore = data;
  return data;
}

function save(data: DataStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ── helpers ──────────────────────────────────────────
export function utcNow(): string {
  return new Date().toISOString();
}
export function randomToken(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}
function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Users ────────────────────────────────────────────
export function createUser(opts: {
  username: string;
  passHash: string;
  role?: Role;
  inviteCodeUsed?: string;
  birth?: string;
  dreamQuota?: number;
}): User {
  const data = load();
  const user: User = {
    id: randomId("usr"),
    username: opts.username,
    passHash: opts.passHash,
    role: opts.role ?? "user",
    inviteCodeUsed: opts.inviteCodeUsed ?? "",
    createdAt: utcNow(),
    birth: opts.birth ?? "",
    dreamQuota: opts.dreamQuota,
  };
  data.users.push(user);
  save(data);
  return user;
}
export function getUserByUsername(username: string): User | null {
  return load().users.find((u) => u.username === username) ?? null;
}
export function getUserById(id: string): User | null {
  return load().users.find((u) => u.id === id) ?? null;
}
export function listUsers(): User[] {
  return load().users.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
/** Patch mutable account fields (birth date, dream quota). */
export function updateUser(id: string, patch: { birth?: string; dreamQuota?: number }): User | null {
  const data = load();
  const u = data.users.find((x) => x.id === id);
  if (!u) return null;
  if (patch.birth !== undefined) u.birth = patch.birth;
  if (patch.dreamQuota !== undefined) u.dreamQuota = patch.dreamQuota;
  save(data);
  return { ...u };
}
/** Hard-delete a user and cascade: their dreams, readings, and sessions. */
export function deleteUser(id: string): boolean {
  const data = load();
  const idx = data.users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  data.users.splice(idx, 1);
  const dreamIds = new Set(data.dreams.filter((d) => d.userId === id).map((d) => d.id));
  data.dreams = data.dreams.filter((d) => d.userId !== id);
  data.readings = data.readings.filter((r) => r.userId !== id && !dreamIds.has(r.dreamId));
  for (const [tok, s] of Object.entries(data.sessions)) {
    if (s.userId === id) delete data.sessions[tok];
  }
  save(data);
  return true;
}

// ── Runtime config ───────────────────────────────────
export function getConfig(): RuntimeConfig {
  return { ...load().config };
}
export function setConfig(patch: RuntimeConfig): RuntimeConfig {
  const data = load();
  data.config = { ...data.config, ...patch };
  save(data);
  return { ...data.config };
}

// ── Sessions ─────────────────────────────────────────
export function createSession(opts: {
  userId: string;
  username: string;
  role: Role;
  accessType: string;
  ttlHours?: number;
}): AccessSession {
  const data = load();
  const ttl = Math.max(1, opts.ttlHours ?? 24 * 30); // default 30 days
  const session: AccessSession = {
    token: randomToken(),
    userId: opts.userId,
    username: opts.username,
    role: opts.role,
    accessType: opts.accessType,
    createdAt: utcNow(),
    expiresAt: new Date(Date.now() + ttl * 3600_000).toISOString(),
  };
  data.sessions[session.token] = session;
  save(data);
  return session;
}
export function getSession(token: string): AccessSession | null {
  if (!token) return null;
  const data = load();
  const s = data.sessions[token];
  if (!s) return null;
  if (new Date() >= new Date(s.expiresAt)) {
    delete data.sessions[token];
    save(data);
    return null;
  }
  return s;
}
export function deleteSession(token: string): void {
  if (!token) return;
  const data = load();
  if (data.sessions[token]) {
    delete data.sessions[token];
    save(data);
  }
}

// ── Invite codes (ported from zhouyi) ────────────────
export function createInviteCode(opts: {
  createdBy: string;
  type: "whitelist" | "quota";
  maxUses?: number;
  code?: string;
  label?: string;
}): InviteCode {
  const data = load();
  const finalCode =
    opts.code?.trim().toUpperCase() || `INV${randomToken().slice(0, 8).toUpperCase()}`;
  if (data.inviteCodes.find((c) => c.code === finalCode)) throw new Error("邀请码已存在");
  const item: InviteCode = {
    code: finalCode,
    type: opts.type,
    usedCount: 0,
    maxUses: opts.type === "whitelist" ? 999999 : Math.max(1, opts.maxUses ?? 10),
    isActive: true,
    label: opts.label ?? "",
    createdBy: opts.createdBy,
    createdAt: utcNow(),
  };
  data.inviteCodes.push(item);
  save(data);
  return { ...item };
}
export function getInviteCode(code: string): InviteCode | null {
  return load().inviteCodes.find((c) => c.code === code.trim().toUpperCase()) ?? null;
}
/** Validate + consume one use. Returns the code if usable, else null. */
export function consumeInviteCode(code: string): InviteCode | null {
  const key = code.trim().toUpperCase();
  if (!key) return null;
  const data = load();
  const item = data.inviteCodes.find((c) => c.code === key);
  if (!item || !item.isActive) return null;
  if (item.type === "whitelist") {
    item.usedCount += 1;
    save(data);
    return { ...item };
  }
  if (item.usedCount >= item.maxUses) {
    item.isActive = false;
    save(data);
    return null;
  }
  item.usedCount += 1;
  if (item.usedCount >= item.maxUses) item.isActive = false;
  save(data);
  return { ...item };
}
export function listInviteCodes(): InviteCode[] {
  return load().inviteCodes.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function updateInviteCode(
  code: string,
  updates: { maxUses?: number; resetUsed?: boolean; label?: string; type?: "whitelist" | "quota" }
): InviteCode | null {
  const data = load();
  const item = data.inviteCodes.find((c) => c.code === code.trim().toUpperCase());
  if (!item) return null;
  if (updates.type !== undefined) item.type = updates.type;
  if (updates.maxUses !== undefined) item.maxUses = Math.max(1, updates.maxUses);
  if (updates.resetUsed) item.usedCount = 0;
  if (updates.label !== undefined) item.label = updates.label;
  item.isActive = item.type === "whitelist" || item.usedCount < item.maxUses;
  save(data);
  return { ...item };
}
export function toggleInviteCode(code: string, isActive: boolean): InviteCode | null {
  const data = load();
  const item = data.inviteCodes.find((c) => c.code === code.trim().toUpperCase());
  if (!item) return null;
  item.isActive = isActive;
  save(data);
  return { ...item };
}
export function deleteInviteCode(code: string): boolean {
  const data = load();
  const idx = data.inviteCodes.findIndex((c) => c.code === code.trim().toUpperCase());
  if (idx === -1) return false;
  data.inviteCodes.splice(idx, 1);
  save(data);
  return true;
}

// ── Usage logs ───────────────────────────────────────
export function addUsageLog(log: Omit<UsageLog, "id" | "timestamp">): UsageLog {
  const data = load();
  const entry: UsageLog = { id: randomId("log"), timestamp: utcNow(), ...log };
  data.usageLogs.push(entry);
  if (data.usageLogs.length > 2000) data.usageLogs = data.usageLogs.slice(-2000);
  save(data);
  return entry;
}
export function getUsageLogs(limit = 50, offset = 0): { logs: UsageLog[]; total: number } {
  const all = load().usageLogs.slice().reverse();
  return { logs: all.slice(offset, offset + limit), total: all.length };
}

// ── Dreams ───────────────────────────────────────────
export function createDream(opts: {
  userId: string;
  date?: string;
  imageryElements: string[];
  question?: string;
  dreamText?: string;
  mood?: string;
  leadGaze?: string;
  elementBaseline?: import("./types").ElementBaseline | null;
  natalBaseline?: import("./types").ElementBaseline | null;
}): Dream {
  const data = load();
  const dream: Dream = {
    id: randomId("drm"),
    userId: opts.userId,
    date: opts.date ?? new Date().toISOString().slice(0, 10),
    imageryElements: opts.imageryElements,
    question: opts.question ?? "",
    dreamText: opts.dreamText ?? "",
    mood: opts.mood ?? "",
    painterlyProse: "",
    imageUrl: "",
    elementBaseline: opts.elementBaseline ?? null,
    natalBaseline: opts.natalBaseline ?? null,
    leadGaze: opts.leadGaze ?? "",
    createdAt: utcNow(),
  };
  data.dreams.push(dream);
  save(data);
  return dream;
}
export function getDream(id: string): Dream | null {
  return load().dreams.find((d) => d.id === id) ?? null;
}
export function listDreamsByUser(userId: string, limit = 100, offset = 0): Dream[] {
  const all = load()
    .dreams.filter((d) => d.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return all.slice(offset, offset + limit);
}
/** How many dreams a user has recorded — for quota checks. */
export function countDreamsByUser(userId: string): number {
  return load().dreams.filter((d) => d.userId === userId).length;
}
export function updateDream(
  id: string,
  patch: Partial<
    Pick<Dream, "question" | "dreamText" | "mood" | "painterlyProse" | "imageUrl" | "imageryElements">
  >
): Dream | null {
  const data = load();
  const dream = data.dreams.find((d) => d.id === id);
  if (!dream) return null;
  Object.assign(dream, patch);
  save(data);
  return { ...dream };
}
export function deleteDream(id: string): boolean {
  const data = load();
  const idx = data.dreams.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  data.dreams.splice(idx, 1);
  data.readings = data.readings.filter((r) => r.dreamId !== id);
  save(data);
  return true;
}

// ── Readings ─────────────────────────────────────────
/** Create or update the single reading attached to a dream (merges sub-objects). */
export function upsertReading(opts: {
  dreamId: string;
  userId: string;
  cast?: unknown;
  tarot?: unknown;
  debate?: unknown;
  synthesis?: unknown;
}): Reading {
  const data = load();
  let reading = data.readings.find((r) => r.dreamId === opts.dreamId);
  if (!reading) {
    reading = {
      id: randomId("rdg"),
      dreamId: opts.dreamId,
      userId: opts.userId,
      cast: null,
      tarot: null,
      debate: null,
      synthesis: null,
      createdAt: utcNow(),
    };
    data.readings.push(reading);
  }
  if (opts.cast !== undefined) reading.cast = opts.cast;
  if (opts.tarot !== undefined) reading.tarot = opts.tarot;
  if (opts.debate !== undefined) reading.debate = opts.debate;
  if (opts.synthesis !== undefined) reading.synthesis = opts.synthesis;
  save(data);
  return { ...reading };
}
export function getReadingByDream(dreamId: string): Reading | null {
  return load().readings.find((r) => r.dreamId === dreamId) ?? null;
}
