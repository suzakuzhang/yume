import { NextResponse } from "next/server";
import { addUsageLog, claimUsername, createSession, getDream, getUserById, updateDream } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { getCapabilities } from "@/lib/access/roles";

export const dynamic = "force-dynamic";

const ID_RE = /^[A-Za-z0-9]{1,18}$/;

/**
 * Keep this dream in the library (拂晓 decision). Two ways in:
 *   - with `id`  → claim a memorable id (rename the anon account, or merge into an
 *                  existing one) so the dream is retrievable later via /diary.
 *   - without id → anonymous keep: it stays in the library/corpus but unnamed.
 * Either way labConsent = true. An optional `reflection` (感悟) is stored too.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dream = getDream(params.id);
  if (!dream || dream.userId !== ctx.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  let body: { id?: string; reflection?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const chosenId = (body.id ?? "").trim();
  const reflection = typeof body.reflection === "string" ? body.reflection : undefined;

  const updated = updateDream(dream.id, { labConsent: true, ...(reflection !== undefined ? { reflection } : {}) });

  // anonymous keep — into the library, no id
  if (!chosenId) {
    addUsageLog({ action: "keep", role: ctx.user.role, userId: ctx.user.id, detail: "anon" });
    return NextResponse.json({ dream: updated, claimed: false });
  }

  // claim a memorable id
  if (!ID_RE.test(chosenId)) {
    return NextResponse.json({ error: "ID 只能是英文和数字，且不超过 18 位" }, { status: 400 });
  }
  const result = claimUsername(ctx.user.id, chosenId);
  if (!result) return NextResponse.json({ error: "保留失败" }, { status: 500 });

  const finalUser = getUserById(result.user.id)!;
  // merge moved dreams to another account → that account needs a fresh session
  let accessToken: string | undefined;
  let expiresAt: string | undefined;
  if (result.merged) {
    const session = createSession({ userId: finalUser.id, username: finalUser.username, role: finalUser.role, accessType: "claim" });
    accessToken = session.token;
    expiresAt = session.expiresAt;
  }
  addUsageLog({ action: "keep", role: finalUser.role, userId: finalUser.id, detail: result.merged ? `claim·merge ${chosenId}` : `claim ${chosenId}` });

  return NextResponse.json({
    dream: getDream(dream.id),
    claimed: true,
    user: { id: finalUser.id, username: finalUser.username, role: finalUser.role },
    capabilities: getCapabilities(finalUser.role),
    ...(accessToken ? { accessToken, expiresAt } : {}),
  });
}
