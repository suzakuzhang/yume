import type { Yao } from "@/types/trigram";
import type { Hexagram } from "@/types/hexagram";
import type { HexagramLine } from "@/types/casting";
import type { RuleTrace } from "@/types/reading";
import { findHexagramFromLines } from "@/lib/data/hexagrams";

/**
 * 错卦：每爻阴阳互换（阴变阳，阳变阴）
 */
export function computeInverseHexagram(
  lines: HexagramLine[]
): { hexagram: Hexagram | null; trace: RuleTrace } {
  const sorted = [...lines].sort((a, b) => a.position - b.position);
  const values = sorted.map((l) => l.value);

  const inversed = values.map((v) => (1 - v) as Yao) as [Yao, Yao, Yao, Yao, Yao, Yao];
  const hexagram = findHexagramFromLines(inversed);

  return {
    hexagram,
    trace: {
      ruleId: "cast_inverse_hexagram",
      ruleName: "错卦",
      category: "casting",
      inputEvidence: {
        originalLines: values.join(""),
        inversedLines: inversed.join(""),
      },
      result: hexagram
        ? { hexagramId: hexagram.id, hexagramName: hexagram.fullName }
        : null,
      confidence: "high",
      notes: "错卦将每爻阴阳互换。",
    },
  };
}
