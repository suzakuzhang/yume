import type { Yao } from "./trigram";
import type { LinePosition, Hexagram } from "./hexagram";
import type { ReadingStrategy, RuleTrace } from "./reading";

export interface HexagramLine {
  position: LinePosition;
  value: Yao;
  changing: boolean;
}

export interface CastInput {
  method: "manual" | "coin" | "number";
  lines: HexagramLine[];   // exactly 6, from bottom (pos=1) to top (pos=6)
  question?: string;
}

export interface CastResult {
  id: string;                              // unique cast ID
  input: CastInput;
  originalHexagram: Hexagram;
  changingLines: LinePosition[];
  changedHexagram: Hexagram | null;
  mutualHexagram: Hexagram | null;         // 互卦 (Phase 2)
  inverseHexagram: Hexagram | null;        // 错卦 (Phase 2)
  reversedHexagram: Hexagram | null;       // 综卦 (Phase 2)
  readingStrategy: ReadingStrategy;
  traces: RuleTrace[];
}
