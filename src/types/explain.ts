import type { TextRef, RuleTrace, ReadingStrategy } from "./reading";
import type { CastResult } from "./casting";

export interface StructureLayer {
  originalHexagramName: string;
  originalHexagramId: number;
  upperTrigram: string;
  lowerTrigram: string;
  changingLines: number[];
  changedHexagramName: string | null;
  changedHexagramId: number | null;
  yinYangDistribution: { yin: number; yang: number };
  dynamicStaticRelation: string;
}

export interface InterpretationResult {
  structure: StructureLayer;
  texts: TextRef[];
  ruleTraces: RuleTrace[];
  summary: string | null;     // Layer 4 LLM summary (null if not requested)
  readingStrategy: ReadingStrategy;
  rawCastResult: CastResult;
}
