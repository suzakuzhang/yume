import type { Hexagram, LinePosition } from "@/types/hexagram";
import type { ReadingStrategy, RuleTrace } from "@/types/reading";
import { defaultClassicPolicy, compatiblePolicy } from "./policies";

export type PolicyName = "default_classic" | "compatible";

export function buildReadingStrategy(
  original: Hexagram,
  changed: Hexagram | null,
  changingLines: LinePosition[],
  policyName: PolicyName = "default_classic"
): { strategy: ReadingStrategy; traces: RuleTrace[] } {
  if (policyName === "compatible") {
    return compatiblePolicy(original, changed, changingLines);
  }
  return defaultClassicPolicy(original, changed, changingLines);
}
