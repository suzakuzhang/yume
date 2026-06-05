/**
 * Four-lens debate. Without a key: each lens speaks its stance + the matched
 * symbol-dictionary readings (key-free, verifiable now). With AIHUBMIX_API_KEY:
 * a generative debate — Round 1 立论 (4 parallel), Round 2 求同存异 discussion,
 * Round 3 synthesis (guidance + self-inquiry). Falls back to static on error.
 */
import { callLLM, callLLMJson } from "@/lib/llm/callLLM";
import { matchSymbols, readingsFor, shortSymbol } from "@/lib/kb/retrieve";
import { recordDeterministic } from "@/lib/experiments/sink";
import type { SpanMeta } from "@/lib/experiments/types";
import { LENSES, REFEREES, type Lens } from "./personas";

type Locale = "zh" | "en";

export interface LensView {
  key: string;
  nameZh: string;
  nameEn: string;
  colorVar: string;
  portrait?: string;
  stance: string;
  statement?: string; // generative opening
  evidence: { symbol: string; meaning: string }[];
}
export interface DebateSynthesis {
  consensus: string;
  divergence: string;
  guidance: string;
  selfInquiry: string[];
}
export interface DebateResult {
  mode: "static" | "generative";
  matched: string[];
  views: LensView[];
  discussion?: string;
  synthesis?: DebateSynthesis;
  note?: string;
  generatedAt: string;
}

export interface DebateInput {
  imagery: string[];
  question: string;
  dreamText: string;
  mood: string;
  cast?: { original?: { fullName?: string; guaCi?: string }; changed?: { fullName?: string } | null } | null;
  tarot?: { name_zh?: string; orientation?: string; reading?: { core?: string } } | null;
  baseline?: { ganzhiDay?: string; wuxing?: { cn?: string; imagery?: string } } | null;
  locale?: Locale;
  /** when set, the debate's spans are recorded for /lab (prod = the dream id). */
  traceId?: string;
}

function castLine(input: DebateInput): string {
  if (!input.cast?.original?.fullName) return "";
  const c = input.cast;
  return `本卦${c.original!.fullName}「${c.original!.guaCi ?? ""}」${c.changed?.fullName ? ` 变${c.changed.fullName}` : ""}`;
}
function tarotLine(input: DebateInput): string {
  if (!input.tarot?.name_zh) return "";
  const o = input.tarot.orientation === "reversed" ? "逆位" : "正位";
  return `塔罗 ${input.tarot.name_zh}（${o}）${input.tarot.reading?.core ?? ""}`;
}
function baselineLine(input: DebateInput): string {
  const b = input.baseline;
  return b?.ganzhiDay ? `今日基音 ${b.ganzhiDay} · ${b.wuxing?.cn ?? ""}（${b.wuxing?.imagery ?? ""}）` : "";
}

function staticView(lens: Lens, evidence: { symbol: string; meaning: string }[], locale: Locale, extra: string): LensView {
  return {
    key: lens.key,
    nameZh: lens.nameZh,
    nameEn: lens.nameEn,
    colorVar: lens.colorVar,
    portrait: lens.portrait,
    stance: lens.staticStance[locale] + (extra ? `　${extra}` : ""),
    evidence,
  };
}

export async function runDebate(input: DebateInput): Promise<DebateResult> {
  const locale: Locale = input.locale ?? "zh";
  const matchedEntries = matchSymbols(input.imagery, input.dreamText);
  const matched = matchedEntries.map((e) => shortSymbol(e.symbol));
  const hasKey = !!process.env.AIHUBMIX_API_KEY?.trim();

  // instrumentation: only when a trace anchor is given (prod = dream id)
  const tid = input.traceId;
  const meta = (phase: string, role: string | null): SpanMeta | undefined =>
    tid ? { traceId: tid, feature: "debate", phase, role } : undefined;
  if (tid) recordDeterministic({ traceId: tid, feature: "retrieve", role: null }, { imagery: input.imagery, matched, count: matched.length });

  // per-lens evidence from the symbol dictionary (a lens may span several traditions)
  const evidenceFor = (traditions: string[]) => {
    const seen = new Set<string>();
    const out: { symbol: string; meaning: string }[] = [];
    for (const tr of traditions) {
      for (const r of readingsFor(matchedEntries, tr)) {
        if (!seen.has(r.symbol)) {
          seen.add(r.symbol);
          out.push(r);
        }
      }
    }
    return out;
  };
  const ev: Record<string, { symbol: string; meaning: string }[]> = {};
  for (const l of LENSES) ev[l.key] = evidenceFor(l.traditions);

  // ── static (key-free) ──
  if (!hasKey) {
    if (tid) recordDeterministic({ traceId: tid, feature: "debate", phase: "static", role: null }, { fallback: true, reason: "no_api_key", lenses: LENSES.map((l) => l.key) });
    const views = LENSES.map((l) =>
      staticView(l, ev[l.key], locale, l.key === "shuxu" ? [castLine(input), tarotLine(input)].filter(Boolean).join("；") : "")
    );
    return {
      mode: "static",
      matched,
      views,
      note: locale === "zh" ? "四种目光各执其象。完整的求同存异讨论将在接入解读模型后点亮。" : "Each gaze holds its own images. The full discussion lights up once the reading model is connected.",
      generatedAt: new Date().toISOString(),
    };
  }

  // ── generative ──
  try {
    const ctx = [
      `意象：${input.imagery.join("、")}`,
      input.question ? `所问：${input.question}` : "",
      input.dreamText ? `梦境：${input.dreamText}` : "",
      input.mood ? `心绪：${input.mood}` : "",
      baselineLine(input),
      castLine(input),
      tarotLine(input),
    ].filter(Boolean).join("\n");
    const langNote = locale === "zh" ? "用中文。" : "Respond in English.";

    // Round 1 — 立论 (parallel)
    const openings = await Promise.all(
      LENSES.map(async (l) => {
        const evTxt = ev[l.key].map((e) => `${e.symbol}：${e.meaning}`).join("；");
        const sys = `${l.voice} ${langNote} 80-160字，第二人称，立论而不啰嗦。`;
        const usr = `${ctx}\n\n你这一派对相关意象的读法参考：${evTxt || "（词典中无直接条目，凭你的方法立论）"}\n\n请给出你对这个梦的解读。`;
        const statement = await callLLM(sys, usr, { temperature: 0.85, maxTokens: 500, meta: meta("R1_open", l.key) });
        return { lens: l, statement };
      })
    );

    const views: LensView[] = openings.map(({ lens, statement }) => ({
      key: lens.key,
      nameZh: lens.nameZh,
      nameEn: lens.nameEn,
      colorVar: lens.colorVar,
      portrait: lens.portrait,
      stance: lens.staticStance[locale],
      statement,
      evidence: ev[lens.key],
    }));

    // Round 2 — 求同存异 discussion
    const openingsTxt = openings.map((o) => `【${o.lens.nameZh}】${o.statement}`).join("\n");
    const refTxt = REFEREES.map((r) => `【${r.nameZh}】${r.voice}`).join("\n");
    const discussion = await callLLM(
      `你是这场四目光对话的主持。让弗洛伊德、荣格、术数、道家彼此回应:何处求同、何处存异，可互相质询、扮演。${langNote} 200-360字，呈现交锋而非复述。梦科学在旁校准，可被引用但不作裁决。`,
      `四家立论：\n${openingsTxt}\n\n旁注：\n${refTxt}`,
      { temperature: 0.8, maxTokens: 900, meta: meta("R2_discuss", "moderator") }
    );

    // Round 3 — synthesis
    const synthesis = await callLLMJson<DebateSynthesis>(
      `综合四目光的对话，照见做梦者自己(yume 是一面镜子)。${langNote} 仅输出 JSON:{"consensus":求同之处(60-110字),"divergence":存异之处(60-110字),"guidance":给做梦者的一句话建议(40-80字),"selfInquiry":[2-3个值得自问的问题]}。不替人决定命运。`,
      `立论：\n${openingsTxt}\n\n讨论：\n${discussion}`,
      { temperature: 0.8, maxTokens: 900, meta: meta("R3_synth", "moderator") }
    );

    return { mode: "generative", matched, views, discussion, synthesis, generatedAt: new Date().toISOString() };
  } catch {
    // graceful fallback to static
    if (tid) recordDeterministic({ traceId: tid, feature: "debate", phase: "static", role: null }, { fallback: true, reason: "generative_error" });
    const views = LENSES.map((l) =>
      staticView(l, ev[l.key], locale, l.key === "shuxu" ? [castLine(input), tarotLine(input)].filter(Boolean).join("；") : "")
    );
    return { mode: "static", matched, views, note: "解读模型暂不可用，先呈现各派象义。", generatedAt: new Date().toISOString() };
  }
}
