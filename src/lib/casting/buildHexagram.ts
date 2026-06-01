import type { Yao } from "@/types/trigram";
import type { Hexagram } from "@/types/hexagram";
import type { HexagramLine } from "@/types/casting";
import type { RuleTrace } from "@/types/reading";
import { findHexagramFromLines } from "@/lib/data/hexagrams";

export function buildHexagramFromLines(
  lines: HexagramLine[]
): { hexagram: Hexagram; trace: RuleTrace } | null {
  if (lines.length !== 6) return null;

  const sorted = [...lines].sort((a, b) => a.position - b.position);
  const yaoValues = sorted.map((l) => l.value) as [Yao, Yao, Yao, Yao, Yao, Yao];

  const hexagram = findHexagramFromLines(yaoValues);
  if (!hexagram) return null;

  const trace: RuleTrace = {
    ruleId: "cast_identify_hexagram",
    ruleName: "识别本卦",
    category: "casting",
    inputEvidence: {
      lines: yaoValues.join(""),
      lowerTrigram: hexagram.lowerTrigram,
      upperTrigram: hexagram.upperTrigram,
    },
    result: { hexagramId: hexagram.id, hexagramName: hexagram.name },
    confidence: "high",
    sourceRefs: [`hexagram:${hexagram.id}`],
  };

  return { hexagram, trace };
}
