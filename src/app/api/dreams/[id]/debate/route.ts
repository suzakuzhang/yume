import { NextResponse } from "next/server";
import { addUsageLog, getDream, getReadingByDream, upsertReading } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { runDebate } from "@/lib/debate/engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dream = getDream(params.id);
  if (!dream || dream.userId !== ctx.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const locale = new URL(req.url).searchParams.get("locale") === "en" ? "en" : "zh";
  const reading = getReadingByDream(dream.id);

  const debate = await runDebate({
    imagery: dream.imageryElements,
    question: dream.question,
    dreamText: dream.dreamText,
    mood: dream.mood,
    cast: (reading?.cast as never) ?? null,
    tarot: (reading?.tarot as never) ?? null,
    baseline: (dream.elementBaseline as never) ?? null,
    locale,
  });

  upsertReading({ dreamId: dream.id, userId: ctx.user.id, debate });
  addUsageLog({ action: "debate", role: ctx.user.role, userId: ctx.user.id, detail: `${debate.mode} · ${debate.matched.join("、")}` });

  return NextResponse.json({ debate });
}
