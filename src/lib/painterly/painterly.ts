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
  const im = imagery.join(locale === "zh" ? "、" : " · ");
  if (locale === "en") {
    return `${im} — ink, and the rest left blank.`;
  }
  return `${im}，其余皆留白。`;
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
  const sys = `你是一位惜墨如金的文人画家。把梦境意象凝成一句题画诗般的短语——越少字越有共鸣。可借笔墨留白之意（${BRUSH_ZH}），但只取一笔。${langNote} 不超过 16 字（英文不超过 12 词），一行，留白其余。不加引号、不解释。`;
  const usr = `意象：${opts.imagery.join("、")}\n${opts.dreamText ? `梦境：${opts.dreamText}\n` : ""}今日之气：${opts.element}`;
  try {
    const prose = await callLLM(sys, usr, { temperature: 0.85, maxTokens: 80 });
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
