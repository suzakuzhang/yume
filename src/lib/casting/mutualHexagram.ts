import type { Yao } from "@/types/trigram";
import type { Hexagram } from "@/types/hexagram";
import type { HexagramLine } from "@/types/casting";
import type { RuleTrace } from "@/types/reading";
import { findHexagramFromLines } from "@/lib/data/hexagrams";

/**
 * 互卦：取原卦 2-3-4 爻为下卦，3-4-5 爻为上卦
 */
export function computeMutualHexagram(
  lines: HexagramLine[]
): { hexagram: Hexagram | null; trace: RuleTrace } {
  const sorted = [...lines].sort((a, b) => a.position - b.position);
  if (sorted.length !== 6) {
    return {
      hexagram: null,
      trace: {
        ruleId: "cast_mutual_error",
        ruleName: "互卦计算失败",
        category: "casting",
        inputEvidence: { lineCount: sorted.length },
        result: null,
        confidence: "low",
      },
    };
  }

  const values = sorted.map((l) => l.value);
  // 下卦 = 2,3,4 爻（index 1,2,3）, 上卦 = 3,4,5 爻（index 2,3,4）
  const mutualLines: [Yao, Yao, Yao, Yao, Yao, Yao] = [
    values[1] as Yao, values[2] as Yao, values[3] as Yao,
    values[2] as Yao, values[3] as Yao, values[4] as Yao,
  ];

  const hexagram = findHexagramFromLines(mutualLines);

  return {
    hexagram,
    trace: {
      ruleId: "cast_mutual_hexagram",
      ruleName: "互卦",
      category: "casting",
      inputEvidence: {
        originalLines: values.join(""),
        lowerTrigram: `爻${2}-${3}-${4}`,
        upperTrigram: `爻${3}-${4}-${5}`,
        mutualLines: mutualLines.join(""),
      },
      result: hexagram
        ? { hexagramId: hexagram.id, hexagramName: hexagram.fullName }
        : null,
      confidence: "high",
      notes: "互卦取原卦二三四爻为下卦，三四五爻为上卦。",
    },
  };
}
