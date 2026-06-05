import { NextResponse } from "next/server";
import { deleteDream, getDream, getReadingByDream, updateDream } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { deleteTrace } from "@/lib/experiments/sink";

export const dynamic = "force-dynamic";

/** Load a dream and assert the request's user owns it. */
function ownedDream(req: Request, id: string) {
  const ctx = userFromRequest(req);
  if (!ctx) return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }) } as const;
  const dream = getDream(id);
  if (!dream || dream.userId !== ctx.user.id) {
    return { error: NextResponse.json({ error: "未找到" }, { status: 404 }) } as const;
  }
  return { ctx, dream } as const;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const r = ownedDream(req, params.id);
  if ("error" in r) return r.error;
  return NextResponse.json({ dream: r.dream, reading: getReadingByDream(r.dream.id) });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const r = ownedDream(req, params.id);
  if ("error" in r) return r.error;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  const patch: Parameters<typeof updateDream>[1] = {};
  if (Array.isArray(body.imageryElements)) {
    patch.imageryElements = (body.imageryElements as unknown[]).map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof body.question === "string") patch.question = body.question;
  if (typeof body.dreamText === "string") patch.dreamText = body.dreamText;
  if (typeof body.mood === "string") patch.mood = body.mood;
  const updated = updateDream(r.dream.id, patch);
  return NextResponse.json({ dream: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const r = ownedDream(req, params.id);
  if ("error" in r) return r.error;
  const ok = deleteDream(r.dream.id);
  deleteTrace(r.dream.id); // a discarded dream leaves no spans behind
  return NextResponse.json({ ok });
}
