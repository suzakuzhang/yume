import type { RuleTrace } from "@/types/reading";

export function buildRuleTrace(traces: RuleTrace[]): RuleTrace[] {
  // Currently pass-through. Phase 2 may add formatting or filtering.
  return traces;
}
