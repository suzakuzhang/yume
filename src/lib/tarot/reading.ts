import { callLLMJson } from "@/lib/llm/callLLM";
import type { Orientation, TarotCard } from "./deck";

export interface TarotReading {
  core: string;
  context: string;
  advice: string;
  source: "llm" | "static";
}

const SYSTEM = `你是 yume 的塔罗牌灵，借一张大阿卡纳之牌，为做梦者照见自己。语气沉静、第二人称、像镜中低语，不臆断命运、不空泛。
结合牌的正/逆位牌义、用户的问题，以及"今日基音"（当日五行/元素之气）给出解读。
仅输出 JSON：{"core": 一句话点出此牌此刻的核心(40-70字), "context": 结合问题与今日基音的展开(80-160字), "advice": 一句温柔而具体的提醒(30-60字)}。`;

/** Build a tarot reading. Without an LLM key, falls back to the card's static meanings. */
export async function buildTarotReading(
  card: TarotCard,
  orientation: Orientation,
  question: string,
  baseline: string
): Promise<TarotReading> {
  const meaning = orientation === "upright" ? card.upright_meaning : card.reversed_meaning;
  const oriCn = orientation === "upright" ? "正位" : "逆位";

  if (!process.env.AIHUBMIX_API_KEY?.trim()) {
    // graceful pre-key fallback: the card's own meanings
    return { core: card.summary_meaning, context: meaning, advice: "", source: "static" };
  }

  const user = `牌：${card.name_zh} ${card.name_en}（${oriCn}）
画面：${card.visual_description}
牌义：${meaning}
用户的问题：${question || "（未明确，给一般性照见）"}
今日基音：${baseline || "（无）"}`;

  try {
    const j = await callLLMJson<{ core?: string; context?: string; advice?: string }>(SYSTEM, user, {
      temperature: 0.85,
      maxTokens: 700,
    });
    return {
      core: j.core ?? card.summary_meaning,
      context: j.context ?? meaning,
      advice: j.advice ?? "",
      source: "llm",
    };
  } catch {
    return { core: card.summary_meaning, context: meaning, advice: "", source: "static" };
  }
}
