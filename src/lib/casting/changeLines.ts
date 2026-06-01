import type { Yao } from "@/types/trigram";
import type { Hexagram, LinePosition } from "@/types/hexagram";
import type { HexagramLine } from "@/types/casting";
import type { RuleTrace } from "@/types/reading";
import { findHexagramFromLines } from "@/lib/data/hexagrams";

export function computeChangedHexagram(
  lines: HexagramLine[]
): {
  changedHexagram: Hexagram | null;
  changingLines: LinePosition[];
  trace: RuleTrace;
} {
  const sorted = [...lines].sort((a, b) => a.position - b.position);
  const changingLines: LinePosition[] = [];

  for (const line of sorted) {
    if (line.changing) {
      changingLines.push(line.position);
    }
  }

  if (changingLines.length === 0) {
    return {
      changedHexagram: null,
      changingLines: [],
      trace: {
        ruleId: "cast_no_changing",
        ruleName: "无动爻",
        category: "casting",
        inputEvidence: { changingLineCount: 0 },
        result: { changedHexagram: null },
        confidence: "high",
      },
    };
  }

  // Flip changing lines
  const flipped = sorted.map((l) => ({
    ...l,
    value: l.changing ? ((1 - l.value) as Yao) : l.value,
  }));

  const flippedValues = flipped.map((l) => l.value) as [Yao, Yao, Yao, Yao, Yao, Yao];
  const changedHexagram = findHexagramFromLines(flippedValues);

  const trace: RuleTrace = {
    ruleId: "cast_change_lines",
    ruleName: "动爻变卦",
    category: "casting",
    inputEvidence: {
      changingLines,
      changingLineCount: changingLines.length,
      originalLines: sorted.map((l) => l.value).join(""),
      flippedLines: flippedValues.join(""),
    },
    result: changedHexagram
      ? { hexagramId: changedHexagram.id, hexagramName: changedHexagram.name }
      : null,
    confidence: "high",
    sourceRefs: changedHexagram ? [`hexagram:${changedHexagram.id}`] : [],
  };

  return { changedHexagram, changingLines, trace };
}
