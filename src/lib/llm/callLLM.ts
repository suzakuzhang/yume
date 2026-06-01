/**
 * Generic LLM wrapper for yume — the single seam every feature (debate, tarot,
 * painterly synthesis, longitudinal) calls.
 *
 * Routed through the **aihubmix** OpenAI-compatible gateway, so ONE key
 * (AIHUBMIX_API_KEY) covers every chat model (DeepSeek / Gemini / GPT / Claude…)
 * and, later, image generation. Model names are configurable via env.
 *
 *   - format "text" → returns the assistant string
 *   - format "json" → asks for response_format json_object (use callLLMJson to parse)
 *   - a fallback model (YUME_MODEL_FALLBACK) is tried if the primary call fails
 *
 * Env:
 *   AIHUBMIX_API_KEY        (required at runtime)
 *   AIHUBMIX_BASE_URL       default https://aihubmix.com/v1
 *   YUME_MODEL              default chat model (default "deepseek-chat")
 *   YUME_MODEL_FALLBACK     optional secondary model on failure
 */

export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMError";
  }
}

export type LLMFormat = "text" | "json";

export interface CallLLMOptions {
  format?: LLMFormat;
  temperature?: number;
  maxTokens?: number;
  /** Override the model for this call (else YUME_MODEL). */
  model?: string;
}

function baseUrl(): string {
  return (process.env.AIHUBMIX_BASE_URL?.trim() || "https://aihubmix.com/v1").replace(/\/$/, "");
}
function apiKey(): string {
  const k = process.env.AIHUBMIX_API_KEY?.trim();
  if (!k) throw new LLMError("未检测到 AIHUBMIX_API_KEY 环境变量");
  return k;
}
function defaultModel(): string {
  return process.env.YUME_MODEL?.trim() || "deepseek-chat";
}

async function chatCompletion(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  opts: { format: LLMFormat; temperature: number; maxTokens: number }
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
  };
  if (opts.format === "json") body.response_format = { type: "json_object" };

  const response = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new LLMError(`aihubmix 错误 (${response.status}) [${model}]: ${text.slice(0, 500)}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) throw new LLMError(`aihubmix 返回为空 [${model}]`);
  return text;
}

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options: CallLLMOptions = {}
): Promise<string> {
  const opts = {
    format: options.format ?? ("text" as LLMFormat),
    temperature: options.temperature ?? 0.8,
    maxTokens: options.maxTokens ?? 2048,
  };
  const primary = options.model?.trim() || defaultModel();
  const fallback = process.env.YUME_MODEL_FALLBACK?.trim();

  try {
    return await chatCompletion(primary, systemPrompt, userPrompt, opts);
  } catch (err) {
    if (fallback && fallback !== primary) {
      return chatCompletion(fallback, systemPrompt, userPrompt, opts);
    }
    throw err;
  }
}

/** Strip ```json fences a model may wrap around JSON, then parse leniently. */
export function parseJsonLoose<T = unknown>(raw: string): T {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s) as T;
  } catch {
    const m = s.match(/[{[][\s\S]*[}\]]/);
    if (m) return JSON.parse(m[0]) as T;
    throw new LLMError("LLM 返回的 JSON 无法解析");
  }
}

/** Call with json format and return a parsed, typed object. */
export async function callLLMJson<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  options: Omit<CallLLMOptions, "format"> = {}
): Promise<T> {
  const raw = await callLLM(systemPrompt, userPrompt, { ...options, format: "json" });
  return parseJsonLoose<T>(raw);
}
