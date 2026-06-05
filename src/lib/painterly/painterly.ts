/**
 * 凝象 — reverse-guide a dream's imagery into a painting, in the brushwork voice
 * borrowed from rupainting. Two outputs:
 *   1) painterly PROSE (key-free static template, or LLM-enriched with a key)
 *   2) a generated IMAGE via the aihubmix image model (only when keys are set)
 */
import { callLLM } from "@/lib/llm/callLLM";
import type { SpanMeta } from "@/lib/experiments/types";

type Locale = "zh" | "en";

const BRUSH_ZH = "皴擦点染、干笔与湿笔、浓淡相破、三远（高远·深远·平远）、开合虚实，留白以养气";

// each gaze tints the brushwork — it lends air, not interpretation
const LENS_TONE: Record<string, { zh: string; en: string }> = {
  freud: { zh: "潜流暗涌、被掩之欲的微澜", en: "an undercurrent, the faint stir of a hidden wish" },
  jung: { zh: "原型的微光、阴影的边缘", en: "an archetypal glimmer at the edge of shadow" },
  shuxu: { zh: "象数之气、阴阳明灭、吉凶未形", en: "the breath of omen, yin and yang flickering" },
  daoism: { zh: "虚静、物化、忘机的空", en: "stillness, things turning into one another, an emptied mind" },
};

function composeStatic(imagery: string[], element: string, locale: Locale): string {
  const im = imagery.join(locale === "zh" ? "、" : " · ");
  if (locale === "en") {
    return `${im}${element ? ` — the air of ${element}` : ""}, the rest left blank.`;
  }
  return `${im}${element ? `，${element}之气` : ""}，其余皆留白。`;
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
  lens?: string;
  meta?: SpanMeta;
}): Promise<Painterly> {
  if (!process.env.AIHUBMIX_API_KEY?.trim()) {
    return { prose: composeStatic(opts.imagery, opts.element, opts.locale), source: "static" };
  }
  const tone = opts.lens ? LENS_TONE[opts.lens] : undefined;
  // how much the dreamer actually gave us — when it is thin, we stay our hand
  const sparse = opts.imagery.length <= 1 && (opts.dreamText?.trim().length ?? 0) < 12;
  const langNote = opts.locale === "zh" ? "用中文。" : "Respond in English.";
  const sys =
    opts.locale === "zh"
      ? `你是一位惜墨如金的文人画家。把今夜的梦凝成一句题画诗般的短语——写"气"不写"事",重氛围远胜于动作情节。可借笔墨留白之意（${BRUSH_ZH}），但只落一笔；让这一笔落在今日之气${tone ? `与「${tone.zh}」这道目光` : ""}上。${
          sparse ? "做梦者所予甚少——只凝一缕氛围,绝不臆造未提供的人物、地点或情节,宁可更空。" : "忠于做梦者所予,不另添情节。"
        }${langNote} 不超过 16 字,一行,不加引号、不解释。`
      : `You are a literati painter who spares ink like gold. Distill tonight's dream into one title-poem phrase — paint the air, not the action; mood far over event. Borrow the sense of brush and blank space, but lay only one stroke, tinted by the day's air${tone ? ` and the gaze of ${tone.en}` : ""}. ${
          sparse ? "The dreamer gave very little — hold to a single breath of atmosphere; never invent figures, places, or events not given; leave it emptier rather than fuller." : "Stay true to what the dreamer gave; add no plot."
        } ${langNote} No more than 12 words, one line, no quotes, no explanation.`;
  const usr =
    opts.locale === "zh"
      ? `意象：${opts.imagery.join("、")}\n${opts.dreamText ? `梦境：${opts.dreamText}\n` : ""}今日之气：${opts.element}`
      : `Imagery: ${opts.imagery.join(", ")}\n${opts.dreamText ? `Dream: ${opts.dreamText}\n` : ""}Air of the day: ${opts.element}`;
  try {
    const prose = await callLLM(sys, usr, { temperature: sparse ? 0.6 : 0.85, maxTokens: 80, meta: opts.meta });
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
