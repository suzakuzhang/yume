/**
 * 凝象 — reverse-guide a dream's imagery into a painting, in the brushwork voice
 * borrowed from rupainting. Two outputs:
 *   1) painterly PROSE (key-free static template, or LLM-enriched with a key)
 *   2) a generated IMAGE via the aihubmix image model (only when keys are set)
 */
import { callLLM } from "@/lib/llm/callLLM";

type Locale = "zh" | "en";

const BRUSH_ZH = "皴擦点染、干笔与湿笔、浓淡相破、三远（高远·深远·平远）、开合虚实，留白以养气";

function composeStatic(imagery: string[], element: string, locale: Locale): string {
  const im = imagery.join(locale === "zh" ? "、" : ", ");
  if (locale === "en") {
    return `In ink the night takes shape: ${im}. Dry brush against wet, dense strokes broken by pale ones, vast empty space left to breathe. The day's note (${element}) tints the whole field, indigo and faint gold.`;
  }
  return `以水墨写今夜之象：${im}。焦墨破之，淡墨晕之，干湿相生；三远开合，大片留白以养气。今日之气（${element}）浸染其间，靛蓝里透出微金。`;
}

export interface Painterly {
  prose: string;
  source: "llm" | "static";
}

export async function imageryToPainterly(opts: {
  imagery: string[];
  dreamText?: string;
  element: string;
  locale: Locale;
}): Promise<Painterly> {
  if (!process.env.AIHUBMIX_API_KEY?.trim()) {
    return { prose: composeStatic(opts.imagery, opts.element, opts.locale), source: "static" };
  }
  const langNote = opts.locale === "zh" ? "用中文。" : "Respond in English.";
  const sys = `你是一位中国古代文人画家。把用户给的梦境意象，用笔墨与留白的语言反向"显影"成一幅画的描述——不是作画指令，而是观画般的散文。可用术语：${BRUSH_ZH}。${langNote} 150-280字，沉静、有气韵。`;
  const usr = `意象：${opts.imagery.join("、")}\n${opts.dreamText ? `梦境：${opts.dreamText}\n` : ""}今日之气：${opts.element}`;
  try {
    const prose = await callLLM(sys, usr, { temperature: 0.85, maxTokens: 600 });
    return { prose, source: "llm" };
  } catch {
    return { prose: composeStatic(opts.imagery, opts.element, opts.locale), source: "static" };
  }
}

/** A concise visual prompt for the image model, from the imagery + day element. */
export function buildImagePrompt(imagery: string[], element: string): string {
  return `Chinese ink-wash painting (水墨), dreamlike and hypnagogic: ${imagery.join(", ")}. Ample negative space, soft blur, moonlit indigo-violet palette with faint gold, the mood of ${element}. Minimal, atmospheric, no text.`;
}

/** Generate an image via aihubmix (OpenAI-compatible /images/generations). Null if not configured.
 *  `modelOverride` lets internal testing flip models (e.g. ?model=dall-e-3) without redeploying. */
export async function generateImage(prompt: string, modelOverride?: string): Promise<string | null> {
  const key = process.env.AIHUBMIX_API_KEY?.trim();
  const model = modelOverride?.trim() || process.env.YUME_IMAGE_MODEL?.trim();
  if (!key || !model) return null;
  const base = (process.env.AIHUBMIX_BASE_URL?.trim() || "https://aihubmix.com/v1").replace(/\/$/, "");
  try {
    const r = await fetch(`${base}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, prompt, n: 1, size: "1024x1024" }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.data?.[0]?.url ?? (d?.data?.[0]?.b64_json ? `data:image/png;base64,${d.data[0].b64_json}` : null);
  } catch {
    return null;
  }
}
