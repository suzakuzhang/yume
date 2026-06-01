import type { CastInput, CastResult } from "@/types/casting";
import type { RuleTrace } from "@/types/reading";
import { buildHexagramFromLines } from "./buildHexagram";
import { computeChangedHexagram } from "./changeLines";
import { computeMutualHexagram } from "./mutualHexagram";
import { computeInverseHexagram } from "./inverseHexagram";
import { computeReversedHexagram } from "./reversedHexagram";
import { buildReadingStrategy, type PolicyName } from "@/lib/reading/readingEngine";

let castCounter = 0;

function generateCastId(): string {
  castCounter += 1;
  return `cast_${Date.now()}_${castCounter}`;
}

export function cast(input: CastInput, policyName: PolicyName = "default_classic"): CastResult | null {
  const traces: RuleTrace[] = [];

  // Step 1: Identify original hexagram
  const originalResult = buildHexagramFromLines(input.lines);
  if (!originalResult) return null;
  traces.push(originalResult.trace);

  // Step 2: Compute changing lines and changed hexagram
  const changeResult = computeChangedHexagram(input.lines);
  traces.push(changeResult.trace);

  // Step 3: Compute mutual/inverse/reversed hexagrams
  const mutualResult = computeMutualHexagram(input.lines);
  traces.push(mutualResult.trace);

  const inverseResult = computeInverseHexagram(input.lines);
  traces.push(inverseResult.trace);

  const reversedResult = computeReversedHexagram(input.lines);
  traces.push(reversedResult.trace);

  // Step 4: Build reading strategy
  const readingStrategy = buildReadingStrategy(
    originalResult.hexagram,
    changeResult.changedHexagram,
    changeResult.changingLines,
    policyName
  );
  traces.push(...readingStrategy.traces);

  return {
    id: generateCastId(),
    input,
    originalHexagram: originalResult.hexagram,
    changingLines: changeResult.changingLines,
    changedHexagram: changeResult.changedHexagram,
    mutualHexagram: mutualResult.hexagram,
    inverseHexagram: inverseResult.hexagram,
    reversedHexagram: reversedResult.hexagram,
    readingStrategy: readingStrategy.strategy,
    traces,
  };
}
