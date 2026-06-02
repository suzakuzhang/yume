import { NextResponse } from "next/server";
import {
  addUsageLog,
  consumeInviteCode,
  createSession,
  createUser,
  getUserByUsername,
} from "@/lib/store";
import { getCapabilities, ROLE_USER } from "@/lib/access/roles";
import { requireInvite } from "@/lib/access/config";

export const dynamic = "force-dynamic";

const ID_RE = /^[A-Za-z0-9]{1,18}$/;

/**
 * Lightweight, passwordless entry for the beta: invite code (when required) + a
 * custom id (English/digits, ≤18). First time with an id consumes an invite (if
 * invites are required); returning with the same id just resumes the journal.
 */
export async function POST(req: Request) {
  let body: { inviteCode?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  const inviteCode = (body.inviteCode ?? "").trim();
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "ID 只能是英文和数字，且不超过 18 位" }, { status: 400 });
  }

  const existing = getUserByUsername(id);
  if (existing) {
    const session = createSession({
      userId: existing.id,
      username: existing.username,
      role: existing.role,
      accessType: "enter",
    });
    addUsageLog({ action: "enter", role: existing.role, userId: existing.id, detail: "resume" });
    return NextResponse.json({
      accessToken: session.token,
      user: { id: existing.id, username: existing.username, role: existing.role },
      capabilities: getCapabilities(existing.role),
      expiresAt: session.expiresAt,
    });
  }

  // new id — gate by invite policy
  const needInvite = requireInvite();
  let usedCode = "";
  if (needInvite || inviteCode) {
    const consumed = consumeInviteCode(inviteCode);
    if (!consumed) {
      if (needInvite) return NextResponse.json({ error: "邀请码无效或已用尽" }, { status: 403 });
    } else {
      usedCode = consumed.code;
    }
  }

  const user = createUser({ username: id, passHash: "", role: ROLE_USER, inviteCodeUsed: usedCode || "beta" });
  const session = createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
    accessType: "enter",
  });
  addUsageLog({ action: "enter", role: user.role, userId: user.id, detail: usedCode ? `邀请码 ${usedCode}` : "公测" });

  return NextResponse.json({
    accessToken: session.token,
    user: { id: user.id, username: user.username, role: user.role },
    capabilities: getCapabilities(user.role),
    expiresAt: session.expiresAt,
  });
}
