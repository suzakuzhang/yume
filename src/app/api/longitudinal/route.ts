import { NextResponse } from "next/server";
import { listDreamsByUser } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { analyzeTimeline } from "@/lib/longitudinal/analyze";
import { callLLM } from "@/lib/llm/callLLM";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dreams = listDreamsByUser(ctx.user.id);
  return NextResponse.json({ timeline: analyzeTimeline(dreams) });
}

export async function POST(req: Request) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const locale = new URL(req.url).searchParams.get("locale") === "en" ? "en" : "zh";
  const dreams = listDreamsByUser(ctx.user.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const timeline = analyzeTimeline(dreams);

  if (dreams.length < 2) {
    return NextResponse.json({
      timeline,
      narrative: locale === "zh" ? "梦还太少，timeline 尚未成形。再记几夜，纵向的轨迹才会浮现。" : "Too few dreams yet — record a few more nights for a longitudinal arc to surface.",
      mode: "note",
    });
  }
  if (!process.env.AIHUBMIX_API_KEY?.trim()) {
    return NextResponse.json({
      timeline,
      narrative: locale === "zh" ? "纵向叙事将在接入解读模型后点亮；目前先看复现的意象、情绪与五行分布。" : "The longitudinal narrative lights up once the reading model is connected; for now, see the recurring imagery, moods, and elements.",
      mode: "note",
    });
  }

  const seq = dreams
    .map((d, i) => {
      const eb = d.elementBaseline;
      return `${i + 1}. ${d.date} | 意象:${d.imageryElements.join("、")} | 心绪:${d.mood || "—"} | 基音:${eb?.ganzhiDay ?? "—"}${eb?.wuxing?.cn ?? ""} | 问:${d.question || "—"}`;
    })
    .join("\n");
  const langNote = locale === "zh" ? "用中文。" : "Respond in English.";

  try {
    const narrative = await callLLM(
      `你是 yume 的纵向之眼。给定一个人按时间排列的若干梦，照见其个体化的轨迹——复现的意象与情绪说明什么、如何流变、阴影与整合的走向。${langNote} 220-380字，第二人称，沉静，不替人决定命运，可呼应"认识你自己"。`,
      `复现意象：${timeline.recurrentImagery.map((t) => `${t.label}×${t.count}`).join("、")}\n复现符号：${timeline.recurrentSymbols.map((s) => `${s.symbol}×${s.count}`).join("、")}\n\n梦序列：\n${seq}`,
      { temperature: 0.85, maxTokens: 1100 }
    );
    return NextResponse.json({ timeline, narrative, mode: "generative" });
  } catch {
    return NextResponse.json({ timeline, narrative: "纵向解读暂不可用，先看分布。", mode: "note" });
  }
}
