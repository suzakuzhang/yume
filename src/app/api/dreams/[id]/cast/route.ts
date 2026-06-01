import { NextResponse } from "next/server";
import { addUsageLog, getDream, upsertReading } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { seedFromImagery } from "@/lib/casting/seedFromImagery";
import { cast } from "@/lib/casting";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dream = getDream(params.id);
  if (!dream || dream.userId !== ctx.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const seed = seedFromImagery(dream.imageryElements);
  const result = cast({ method: "manual", lines: seed.lines, question: dream.question });
  if (!result) return NextResponse.json({ error: "起卦失败" }, { status: 500 });

  // rule-based reading: the engine already selected the weighted classical texts
  const castPayload = {
    seed: { lower: seed.lower, upper: seed.upper, rationale: seed.rationale },
    original: {
      name: result.originalHexagram.name,
      fullName: result.originalHexagram.fullName,
      guaCi: result.originalHexagram.guaCi,
      upperTrigram: result.originalHexagram.upperTrigram,
      lowerTrigram: result.originalHexagram.lowerTrigram,
    },
    changingLines: result.changingLines,
    changed: result.changedHexagram
      ? { name: result.changedHexagram.name, fullName: result.changedHexagram.fullName, guaCi: result.changedHexagram.guaCi }
      : null,
    primaryTexts: result.readingStrategy.primaryTexts.map((t) => ({ label: t.label, content: t.content })),
    rationaleText: result.readingStrategy.rationale,
    castAt: new Date().toISOString(),
  };

  upsertReading({ dreamId: dream.id, userId: ctx.user.id, cast: castPayload });
  addUsageLog({ action: "cast", role: ctx.user.role, userId: ctx.user.id, detail: castPayload.original.fullName });

  return NextResponse.json({ cast: castPayload });
}
