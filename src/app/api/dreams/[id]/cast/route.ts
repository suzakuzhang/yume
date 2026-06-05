import { NextResponse } from "next/server";
import { addUsageLog, getDream, upsertReading } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { castByCoin, coinLabel } from "@/lib/casting/coinMethod";
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

  // 周易铜钱法：三枚铜钱掷六次，随机得卦（与时间、意象无关）。
  const draw = castByCoin();
  const result = cast({ method: "coin", lines: draw.lines, question: dream.question });
  if (!result) return NextResponse.json({ error: "起卦失败" }, { status: 500 });

  // EN card: attach Legge's (PD) name + judgment per hexagram; null → render falls back to the Chinese 卦辞
  const locale = new URL(req.url).searchParams.get("locale") === "en" ? "en" : "zh";
  const og = locale === "en" ? leggeFor(result.originalHexagram.id) : null;
  const cg = locale === "en" && result.changedHexagram ? leggeFor(result.changedHexagram.id) : null;

  // rule-based reading: the engine already selected the weighted classical texts
  const castPayload = {
    method: "coin" as const,
    // the six tosses, 初爻(1) → 上爻(6) — the visible proof of the draw
    coins: draw.throws.map((th, i) => ({
      position: i + 1,
      total: th.total,
      label: coinLabel(th.total),
      yang: th.yao === 1,
      changing: th.changing,
    })),
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
      method: "coin",
      coins: draw.throws.map((th) => th.total),
      hexagram: result.originalHexagram.fullName,
      hexagramId: result.originalHexagram.id,
      changingLines: result.changingLines,
      changed: result.changedHexagram?.fullName ?? null,
    }
  );
  addUsageLog({ action: "cast", role: ctx.user.role, userId: ctx.user.id, detail: castPayload.original.fullName });

  return NextResponse.json({ cast: castPayload });
}
