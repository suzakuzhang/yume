import { NextResponse } from "next/server";
import { addUsageLog, createSession, createUser, getUserByUsername } from "@/lib/store";
import { getCapabilities, ROLE_USER } from "@/lib/access/roles";

export const dynamic = "force-dynamic";

const ID_RE = /^[A-Za-z0-9]{1,18}$/;

/**
 * Passwordless retrace entry (/diary): type your id to return to your kept dreams.
 * No invite, no birth date. An existing id resumes its journal; an unknown id just
 * opens a fresh, empty one. (Dreams are created anonymously and claimed at 拂晓 —
 * see /api/auth/anon and /api/dreams/[id]/keep.)
 */
export async function POST(req: Request) {
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "ID 只能是英文和数字，且不超过 18 位" }, { status: 400 });
  }

  const existing = getUserByUsername(id);
  const user = existing ?? createUser({ username: id, passHash: "", role: ROLE_USER, inviteCodeUsed: "diary" });
  const session = createSession({ userId: user.id, username: user.username, role: user.role, accessType: "enter" });
  addUsageLog({ action: "enter", role: user.role, userId: user.id, detail: existing ? "resume" : "new" });

  return NextResponse.json({
    accessToken: session.token,
    user: { id: user.id, username: user.username, role: user.role },
    capabilities: getCapabilities(user.role),
    expiresAt: session.expiresAt,
  });
}
