import { NextResponse } from "next/server";
import { addUsageLog, getDream, getReadingByDream, upsertReading } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { runDebate, synthesizeDawn } from "@/lib/debate/engine";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dream = getDream(params.id);
  if (!dream || dream.userId !== ctx.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const locale = new URL(req.url).searchParams.get("locale") === "en" ? "en" : "zh";
  const reading = getReadingByDream(dream.id);
  const cast = (reading?.cast as any) ?? null;
  const tarot = (reading?.tarot as any) ?? null;

  // 众声 — the four gazes' statements + their 求同存异 交锋
  const debate = await runDebate({
    imagery: dream.imageryElements,
    question: dream.question,
    dreamText: dream.dreamText,
    mood: dream.mood,
    cast,
    tarot,
    baseline: (dream.elementBaseline as never) ?? null,
    locale,
    traceId: dream.id,
  });

  // 拂晓 — a dedicated synthesis over the full readings (imagery + 卦解读 + 牌解读 + 众声)
  const synthesis = await synthesizeDawn({
    imagery: dream.imageryElements,
    question: dream.question,
    dreamText: dream.dreamText,
    mood: dream.mood,
    baseline: (dream.elementBaseline as any) ?? null,
    castReading: cast
      ? { fullName: cast.original?.fullName, guaCi: cast.original?.guaCi, primaryTexts: cast.primaryTexts, rationaleText: cast.rationaleText, changedFullName: cast.changed?.fullName }
      : null,
    tarotReading: tarot
      ? { name: tarot.name_zh, orientation: tarot.orientation, core: tarot.reading?.core, context: tarot.reading?.context, advice: tarot.reading?.advice }
      : null,
    views: debate.views,
    discussion: debate.discussion,
    locale,
    traceId: dream.id,
  });

  upsertReading({ dreamId: dream.id, userId: ctx.user.id, debate, synthesis: synthesis ?? undefined });
  addUsageLog({ action: "debate", role: ctx.user.role, userId: ctx.user.id, detail: `${debate.mode} · ${debate.matched.join("、")}` });

  return NextResponse.json({ debate, synthesis });
}
