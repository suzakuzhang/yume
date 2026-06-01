import type { CastResult } from "@/types/casting";
import type { InterpretationResult } from "@/types/explain";
import { buildStructure } from "./buildStructure";
import { buildTextLayer } from "./buildTextLayer";
import { buildRuleTrace } from "./buildRuleTrace";

export function interpret(castResult: CastResult): InterpretationResult {
  return {
    structure: buildStructure(castResult),
    texts: buildTextLayer(castResult.readingStrategy),
    ruleTraces: buildRuleTrace(castResult.traces),
    summary: null, // Layer 4 LLM summary — Phase 2
    readingStrategy: castResult.readingStrategy,
    rawCastResult: castResult,
  };
}
