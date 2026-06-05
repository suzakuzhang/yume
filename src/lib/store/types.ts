/** Persisted entity types for yume. Stored in SQLite (see db.ts). */

export type Role = "normal" | "user" | "invite" | "pilot" | "admin";

export interface User {
  id: string;
  username: string;
  passHash: string;
  role: Role;
  inviteCodeUsed: string;
  createdAt: string;
  /** the dreamer's birth date (YYYY-MM-DD) → natal 天干地支 / zodiac. "" if unset. */
  birth?: string;
  /** max dreams this user may record. undefined → DEFAULT_QUOTA. */
  dreamQuota?: number;
}

export interface AccessSession {
  token: string;
  userId: string;
  username: string;
  role: Role;
  accessType: string; // "register" | "login" | "admin_code"
  createdAt: string;
  expiresAt: string;
}

export interface InviteCode {
  code: string;
  type: "whitelist" | "quota";
  usedCount: number;
  maxUses: number; // ignored for whitelist
  isActive: boolean;
  label: string;
  createdBy: string;
  createdAt: string;
}

export interface UsageLog {
  id: string;
  timestamp: string;
  action: string; // "register" | "cast" | "tarot" | "debate" | "painterly" | ...
  role: Role;
  userId: string;
  detail: string;
  extra?: Record<string, unknown>;
}

/** The moment's astrological/elemental ground note, captured when the dream is
 *  recorded. Seeds the later divination + 解梦 as a baseline (see lib/almanac). */
export interface ElementBaseline {
  ganzhiDay: string;
  ganzhiYear: string;
  ganzhiHour: string;
  wuxing: { key: string; cn: string; imagery: string };
  western: { key: string; en: string; imagery: string };
  sun: string;
  four: string;
  capturedAt: string;
}

export interface Dream {
  id: string;
  userId: string;
  date: string; // the dream's day (YYYY-MM-DD), user-facing
  imageryElements: string[];
  question: string;
  dreamText: string;
  mood: string;
  painterlyProse: string;
  imageUrl: string;
  elementBaseline: ElementBaseline | null;
  /** the dreamer's natal 天干地支 / zodiac (from their birth date) — the 命 layer beside the day's 运. */
  natalBaseline?: ElementBaseline | null;
  /** the gaze the compass landed on today — leads 众声; "" if none drawn. */
  leadGaze: string;
  createdAt: string;
}

/** A full multi-modal reading attached to one Dream. Sub-objects are opaque JSON. */
export interface Reading {
  id: string;
  dreamId: string;
  userId: string;
  cast: unknown | null; // CastResult (@/types/casting)
  tarot: unknown | null; // { cardId, orientation, reading }
  debate: unknown | null; // DebateResult (@/lib/debate)
  synthesis: unknown | null; // { guidance, selfInquiry[] }
  createdAt: string;
}
