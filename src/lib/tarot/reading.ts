import { callLLMJson } from "@/lib/llm/callLLM";
import type { SpanMeta } from "@/lib/experiments/types";
import type { Orientation, TarotCard } from "./deck";

export interface TarotReading {
  core: string;
  context: string;
  advice: string;
  source: "llm" | "static";
}

const SYSTEM_ZH = `你是 yume 的塔罗牌灵，借一张大阿卡纳之牌，为做梦者照见自己。语气沉静、第二人称、像镜中低语，不臆断命运、不空泛。
结合牌的正/逆位牌义、用户的问题，以及"今日基音"（当日五行/元素之气）给出解读。
仅输出 JSON：{"core": 一句话点出此牌此刻的核心(40-70字), "context": 结合问题与今日基音的展开(80-160字), "advice": 一句温柔而具体的提醒(30-60字)}。`;

const SYSTEM_EN = `You are yume's tarot spirit. Through a single Major Arcana card, hold a mirror to the dreamer. Voice: still, second-person, like a whisper in glass; never foretell fate, never speak in vague generalities.
Read the card's upright/reversed meaning together with the dreamer's question and the day's "ground note" (its elemental air).
Output JSON only: {"core": one line naming what this card means right now (25-45 words), "context": how it meets the question and the day's ground note (50-100 words), "advice": one gentle, concrete reminder (15-35 words)}.`;

/** Build a tarot reading. Without an LLM key, falls back to the card's static meanings. */
export async function buildTarotReading(
  card: TarotCard,
  orientation: Orientation,
  question: string,
  baseline: string,
  locale: "zh" | "en" = "zh",
  meta?: SpanMeta
): Promise<TarotReading> {
  const en = locale === "en";
  const meaning = en
    ? orientation === "upright" ? card.upright_en : card.reversed_en
    : orientation === "upright" ? card.upright_meaning : card.reversed_meaning;
  const summary = en ? card.summary_en : card.summary_meaning;

  if (!process.env.AIHUBMIX_API_KEY?.trim()) {
    // graceful pre-key fallback: the card's own meanings
    return { core: summary, context: meaning, advice: "", source: "static" };
  }

  const ori = en
    ? orientation === "upright" ? "upright" : "reversed"
    : orientation === "upright" ? "正位" : "逆位";
  const user = en
    ? `Card: ${card.name_en} (${ori})
Meaning: ${meaning}
Dreamer's question: ${question || "(none stated — offer a general mirroring)"}
Today's ground note: ${baseline || "(none)"}`
    : `牌：${card.name_zh} ${card.name_en}（${ori}）
画面：${card.visual_description}
牌义：${meaning}
用户的问题：${question || "（未明确，给一般性照见）"}
今日基音：${baseline || "（无）"}`;

  try {
    const j = await callLLMJson<{ core?: string; context?: string; advice?: string }>(en ? SYSTEM_EN : SYSTEM_ZH, user, {
      temperature: 0.85,
      maxTokens: 700,
      meta,
    });
    return {
      core: j.core ?? summary,
      context: j.context ?? meaning,
      advice: j.advice ?? "",
      source: "llm",
    };
  } catch {
    return { core: summary, context: meaning, advice: "", source: "static" };
  }
}
