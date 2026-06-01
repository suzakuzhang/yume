import bcrypt from "bcryptjs";
import { getSession, getUserById } from "@/lib/store";
import type { AccessSession, User } from "@/lib/store/types";

/** Extract the access token from an incoming request (header or ?access_token). */
export function tokenFromRequest(req: Request): string {
  const header = req.headers.get("x-access-token") ?? "";
  if (header.trim()) return header.trim();
  try {
    const url = new URL(req.url);
    return (url.searchParams.get("access_token") ?? "").trim();
  } catch {
    return "";
  }
}

export function sessionFromRequest(req: Request): AccessSession | null {
  return getSession(tokenFromRequest(req));
}

/** Resolve the signed-in user, or null. */
export function userFromRequest(req: Request): { session: AccessSession; user: User } | null {
  const session = sessionFromRequest(req);
  if (!session) return null;
  const user = getUserById(session.userId);
  if (!user) return null;
  return { session, user };
}

/** True when the request carries the admin code (env YUME_ADMIN_CODE). */
export function isAdminRequest(req: Request): boolean {
  const expected = process.env.YUME_ADMIN_CODE?.trim();
  if (!expected) return false;
  const given = (req.headers.get("x-admin-code") ?? "").trim();
  return given !== "" && given === expected;
}

// ── password hashing ─────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
