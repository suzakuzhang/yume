import type { Yao } from "@/types/trigram";
import type { Hexagram } from "@/types/hexagram";
import type { HexagramLine } from "@/types/casting";
import type { RuleTrace } from "@/types/reading";
import { findHexagramFromLines } from "@/lib/data/hexagrams";

/**
 * 综卦：上下翻转（第6爻变第1爻，第5爻变第2爻，依此类推）
 */
export function computeReversedHexagram(
  lines: HexagramLine[]
): { hexagram: Hexagram | null; trace: RuleTrace } {
  const sorted = [...lines].sort((a, b) => a.position - b.position);
  const values = sorted.map((l) => l.value);

  const reversed = [...values].reverse() as [Yao, Yao, Yao, Yao, Yao, Yao];
  const hexagram = findHexagramFromLines(reversed);

  return {
    hexagram,
    trace: {
      ruleId: "cast_reversed_hexagram",
      ruleName: "综卦",
      category: "casting",
      inputEvidence: {
        originalLines: values.join(""),
        reversedLines: reversed.join(""),
      },
      result: hexagram
        ? { hexagramId: hexagram.id, hexagramName: hexagram.fullName }
        : null,
      confidence: "high",
      notes: "综卦将六爻上下翻转。",
    },
  };
}
