import { NextResponse } from "next/server";
import { addUsageLog, getDream, upsertReading } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { drawCard } from "@/lib/tarot/deck";
import { buildTarotReading } from "@/lib/tarot/reading";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dream = getDream(params.id);
  if (!dream || dream.userId !== ctx.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const { card, orientation } = drawCard();
  const eb = dream.elementBaseline;
  const baseline = eb ? `${eb.ganzhiDay} · 五行${eb.wuxing.cn}（${eb.wuxing.imagery}）· ${eb.sun} ${eb.western.en}` : "";

  const reading = await buildTarotReading(card, orientation, dream.question, baseline);

  const tarotPayload = {
    cardId: card.id,
    name_zh: card.name_zh,
    name_en: card.name_en,
    image: card.image,
    orientation,
    reading,
    drawnAt: new Date().toISOString(),
  };
  upsertReading({ dreamId: dream.id, userId: ctx.user.id, tarot: tarotPayload });
  addUsageLog({ action: "tarot", role: ctx.user.role, userId: ctx.user.id, detail: `${card.name_zh} ${orientation}` });

  return NextResponse.json({ tarot: tarotPayload });
}
