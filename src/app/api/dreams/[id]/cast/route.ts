import { NextResponse } from "next/server";
import { addUsageLog, getDream, upsertReading } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { seedFromImagery } from "@/lib/casting/seedFromImagery";
import { cast } from "@/lib/casting";
import { leggeFor } from "@/lib/casting/legge";
import { recordDeterministic } from "@/lib/experiments/sink";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dream = getDream(params.id);
  if (!dream || dream.userId !== ctx.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  // 梦象起卦：由这个梦的意象推卦（火→离、蛇→巽…），可复现 —— 卦从你的梦里长出来。
  const seed = seedFromImagery(dream.imageryElements);
  const result = cast({ method: "manual", lines: seed.lines, question: dream.question });
  if (!result) return NextResponse.json({ error: "起卦失败" }, { status: 500 });

  // EN card: attach Legge's (PD) name + judgment per hexagram; null → render falls back to the Chinese 卦辞
  const locale = new URL(req.url).searchParams.get("locale") === "en" ? "en" : "zh";
  const og = locale === "en" ? leggeFor(result.originalHexagram.id) : null;
  const cg = locale === "en" && result.changedHexagram ? leggeFor(result.changedHexagram.id) : null;

  const castPayload = {
    method: "imagery" as const,
    // why this hexagram: each imagery word → its trigram (火→离, 蛇→巽…)
    seed: { lower: seed.lower, upper: seed.upper, rationale: seed.rationale, matchedCount: seed.matchedCount },
    original: {
      name: result.originalHexagram.name,
      fullName: result.originalHexagram.fullName,
      guaCi: result.originalHexagram.guaCi,
      upperTrigram: result.originalHexagram.upperTrigram,
      lowerTrigram: result.originalHexagram.lowerTrigram,
      ...(og ? { name_en: og.name_en, judgment_en: og.judgment_en } : {}),
    },
    changingLines: result.changingLines,
    changed: result.changedHexagram
      ? { name: result.changedHexagram.name, fullName: result.changedHexagram.fullName, guaCi: result.changedHexagram.guaCi, ...(cg ? { name_en: cg.name_en } : {}) }
      : null,
    primaryTexts: result.readingStrategy.primaryTexts.map((t) => ({ label: t.label, content: t.content })),
    rationaleText: result.readingStrategy.rationale,
    castAt: new Date().toISOString(),
  };

  upsertReading({ dreamId: dream.id, userId: ctx.user.id, cast: castPayload });
  recordDeterministic(
    { traceId: dream.id, feature: "cast", role: "gua" },
    {
      method: "imagery",
      seed: { lower: seed.lower, upper: seed.upper },
      rationale: seed.rationale,
      hexagram: result.originalHexagram.fullName,
      hexagramId: result.originalHexagram.id,
      changingLines: result.changingLines,
      changed: result.changedHexagram?.fullName ?? null,
    }
  );
  addUsageLog({ action: "cast", role: ctx.user.role, userId: ctx.user.id, detail: castPayload.original.fullName });

  return NextResponse.json({ cast: castPayload });
}
