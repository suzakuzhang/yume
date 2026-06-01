import { NextResponse } from "next/server";
import {
  addUsageLog,
  consumeInviteCode,
  createSession,
  createUser,
  getUserByUsername,
} from "@/lib/store";
import { getCapabilities, ROLE_USER } from "@/lib/access/roles";
import { hashPassword } from "@/lib/access/auth";
import { requireInvite } from "@/lib/access/config";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { username?: string; password?: string; inviteCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";
  const inviteCode = (body.inviteCode ?? "").trim();

  if (username.length < 2 || username.length > 32) {
    return NextResponse.json({ error: "用户名需 2–32 个字符" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "口令至少 6 位" }, { status: 400 });
  }
  const needInvite = requireInvite();
  if (needInvite && !inviteCode) {
    return NextResponse.json({ error: "需要邀请码" }, { status: 400 });
  }
  if (getUserByUsername(username)) {
    return NextResponse.json({ error: "用户名已被占用" }, { status: 409 });
  }

  // Open beta: invite optional. If required (or one is provided), validate/consume it.
  let usedCode = "";
  if (needInvite || inviteCode) {
    const consumed = consumeInviteCode(inviteCode);
    if (!consumed) {
      // a missing/invalid code only blocks when invites are required
      if (needInvite) {
        return NextResponse.json({ error: "邀请码无效或已用尽" }, { status: 403 });
      }
    } else {
      usedCode = consumed.code;
    }
  }

  const passHash = await hashPassword(password);
  const user = createUser({ username, passHash, role: ROLE_USER, inviteCodeUsed: usedCode || "beta" });
  const session = createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
    accessType: "register",
  });
  addUsageLog({
    action: "register",
    role: user.role,
    userId: user.id,
    detail: usedCode ? `邀请码 ${usedCode}` : "公测注册",
  });

  return NextResponse.json({
    accessToken: session.token,
    user: { id: user.id, username: user.username, role: user.role },
    capabilities: getCapabilities(user.role),
    expiresAt: session.expiresAt,
  });
}
