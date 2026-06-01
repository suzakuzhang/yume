import { NextResponse } from "next/server";
import { addUsageLog, createSession, getUserByUsername } from "@/lib/store";
import { getCapabilities } from "@/lib/access/roles";
import { verifyPassword } from "@/lib/access/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  const user = getUserByUsername(username);
  if (!user || !(await verifyPassword(password, user.passHash))) {
    return NextResponse.json({ error: "用户名或口令错误" }, { status: 401 });
  }

  const session = createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
    accessType: "login",
  });
  addUsageLog({ action: "login", role: user.role, userId: user.id, detail: "" });

  return NextResponse.json({
    accessToken: session.token,
    user: { id: user.id, username: user.username, role: user.role },
    capabilities: getCapabilities(user.role),
    expiresAt: session.expiresAt,
  });
}
