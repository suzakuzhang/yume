import type { CastResult } from "@/types/casting";
import type { StructureLayer } from "@/types/explain";

export function buildStructure(result: CastResult): StructureLayer {
  const lines = result.originalHexagram.lines;
  const yinCount = lines.filter((v) => v === 0).length;
  const yangCount = lines.filter((v) => v === 1).length;

  let dynamicStaticRelation: string;
  if (result.changingLines.length === 0) {
    dynamicStaticRelation = "全静，无动爻。";
  } else if (result.changingLines.length === 6) {
    dynamicStaticRelation = "全动，六爻皆变。";
  } else {
    const staticCount = 6 - result.changingLines.length;
    dynamicStaticRelation = `${result.changingLines.length}爻动、${staticCount}爻静。动爻位于第${result.changingLines.join("、")}爻。`;
  }

  return {
    originalHexagramName: result.originalHexagram.fullName,
    originalHexagramId: result.originalHexagram.id,
    upperTrigram: result.originalHexagram.upperTrigram,
    lowerTrigram: result.originalHexagram.lowerTrigram,
    changingLines: result.changingLines,
    changedHexagramName: result.changedHexagram?.fullName ?? null,
    changedHexagramId: result.changedHexagram?.id ?? null,
    yinYangDistribution: { yin: yinCount, yang: yangCount },
    dynamicStaticRelation,
  };
}
