/**
 * Experiment instrumentation (T1) — the data model behind yume's hidden /lab.
 *
 * Every action in a dream-reading flow (an AI call, a coin cast, a tarot draw, a
 * symbol lookup) is recorded as one **Span**. A flow's spans share a **traceId**;
 * in production that is the dream's id, so each dream becomes one append-only
 * `experiments/<traceId>.jsonl` file — exactly one explorable artifact for /lab.
 *
 * This layer is write-only background telemetry: it never changes what the user
 * sees and must never break a request (see sink.ts — every write is best-effort).
 */

export type SpanKind = "generative" | "deterministic";

/** What a call site knows about itself; threaded into callLLM / the recorders. */
export interface SpanMeta {
  /** the flow this span belongs to. prod = the dream id (one file per dream). */
  traceId: string;
  parentSpanId?: string | null;
  /** debate | spirit | tarot | cast | draw | retrieve | painterly | longitudinal */
  feature: string;
  /** R1_open | R2_discuss | R3_synth | open | discuss | final | reading | ... */
  phase?: string;
  /** persona/lens: freud | jung | daoism | shuxu | gua | pai | moderator | _conclusion | null */
  role?: string | null;
  /** synthetic | real — privacy partition for the lab. defaults to "real". */
  corpus?: string;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface Span extends SpanMeta {
  spanId: string;
  kind: SpanKind;
  ts: string;
  latencyMs?: number;

  // —— generative only ——
  model?: string;
  params?: { temperature?: number; maxTokens?: number; format?: string };
  systemPrompt?: string;
  userPrompt?: string;
  promptHash?: string;
  responseRaw?: string;
  finishReason?: string;
  usage?: TokenUsage;
  error?: string | null;

  // —— deterministic only ——
  det?: Record<string, unknown>;
}
