import type { Hexagram, LinePosition } from "@/types/hexagram";
import type { TextRef, ReadingStrategy, RuleTrace } from "@/types/reading";
import {
  makeGuaCiRef,
  makeYaoCiRef,
  makeYongCiRef,
  makeTuanRef,
  makeXiangOverallRef,
  makeXiangLineRef,
} from "./selectTexts";

interface PolicyResult {
  strategy: ReadingStrategy;
  traces: RuleTrace[];
}

export function defaultClassicPolicy(
  original: Hexagram,
  changed: Hexagram | null,
  changingLines: LinePosition[]
): PolicyResult {
  const count = changingLines.length;
  const traces: RuleTrace[] = [];

  let primaryTexts: TextRef[] = [];
  let secondaryTexts: TextRef[] = [];
  let rationale = "";

  if (count === 0) {
    // 无动爻：本卦卦辞 + 彖 + 大象
    primaryTexts = [makeGuaCiRef(original)];
    secondaryTexts = [makeTuanRef(original), makeXiangOverallRef(original)];
    rationale = "无动爻，以本卦卦辞为主，参考彖传与大象传。";
  } else if (count === 1) {
    // 一爻动：该爻爻辞为主
    const pos = changingLines[0];
    primaryTexts = [makeYaoCiRef(original, pos)];
    secondaryTexts = [
      makeGuaCiRef(original),
      makeXiangLineRef(original, pos),
    ];
    rationale = `一爻动（第${pos}爻），以该爻爻辞为主。`;
  } else if (count === 2) {
    // 两爻动：上位爻为主，兼看两爻
    const sorted = [...changingLines].sort((a, b) => a - b);
    const upper = sorted[sorted.length - 1];
    primaryTexts = sorted.map((pos) => makeYaoCiRef(original, pos));
    secondaryTexts = [makeGuaCiRef(original)];
    rationale = `两爻动（第${sorted.join("、")}爻），以上位爻（第${upper}爻）为主，兼看两爻。`;
  } else if (count === 3) {
    // 三爻动：本卦 + 变卦卦辞并参
    primaryTexts = [makeGuaCiRef(original)];
    if (changed) primaryTexts.push(makeGuaCiRef(changed));
    secondaryTexts = changingLines.map((pos) => makeYaoCiRef(original, pos));
    rationale = "三爻动，本卦与变卦卦辞并参。";
  } else if (count === 4 && changed) {
    // 四爻动：偏重变卦
    const staticLines = ([1, 2, 3, 4, 5, 6] as LinePosition[]).filter(
      (p) => !changingLines.includes(p)
    );
    primaryTexts = [makeGuaCiRef(changed)];
    secondaryTexts = staticLines.map((pos) => makeYaoCiRef(changed, pos));
    rationale = "四爻动，偏重变卦，参考变卦中不动爻爻辞。";
  } else if (count === 5 && changed) {
    // 五爻动：变卦中不动爻为主
    const staticLine = ([1, 2, 3, 4, 5, 6] as LinePosition[]).find(
      (p) => !changingLines.includes(p)
    );
    if (staticLine) {
      primaryTexts = [makeYaoCiRef(changed, staticLine)];
    }
    secondaryTexts = [makeGuaCiRef(changed)];
    rationale = `五爻动，以变卦中唯一不动爻（第${staticLine}爻）为主。`;
  } else if (count === 6) {
    // 六爻全动
    if (original.id === 1) {
      // 乾：用九
      const yongRef = makeYongCiRef(original);
      primaryTexts = yongRef ? [yongRef] : [makeGuaCiRef(original)];
      if (changed) secondaryTexts = [makeGuaCiRef(changed)];
      rationale = "六爻全动（乾卦），以用九为主。";
    } else if (original.id === 2) {
      // 坤：用六
      const yongRef = makeYongCiRef(original);
      primaryTexts = yongRef ? [yongRef] : [makeGuaCiRef(original)];
      if (changed) secondaryTexts = [makeGuaCiRef(changed)];
      rationale = "六爻全动（坤卦），以用六为主。";
    } else {
      // 其他：以变卦为主
      if (changed) primaryTexts = [makeGuaCiRef(changed)];
      secondaryTexts = [makeGuaCiRef(original)];
      rationale = "六爻全动，以变卦卦辞为主，本卦卦辞为辅。";
    }
  }

  const trace: RuleTrace = {
    ruleId: "reading_default_classic",
    ruleName: "经典阅读策略",
    category: "reading",
    inputEvidence: {
      changingLineCount: count,
      changingLines,
      originalHexagramId: original.id,
      changedHexagramId: changed?.id ?? null,
    },
    result: {
      primaryCount: primaryTexts.length,
      secondaryCount: secondaryTexts.length,
      rationale,
    },
    confidence: count <= 1 || count === 6 ? "high" : "medium",
    notes: count >= 2 && count <= 5
      ? "多动爻阅读策略存在传统分歧，此处采用经典策略。"
      : undefined,
  };

  traces.push(trace);

  return {
    strategy: {
      policyName: "default_classic",
      changingLineCount: count,
      primaryTexts,
      secondaryTexts,
      rationale,
    },
    traces,
  };
}


/**
 * 兼容策略：对多动爻情况采取更宽松的阅读方式。
 * 与经典策略的主要差异：
 * - 两动爻：两爻等权并看，不区分主次
 * - 三动爻：本卦变卦等权，同时看动爻
 * - 四/五动爻：本卦变卦并参
 * - 六动爻：一律本卦变卦并参
 */
export function compatiblePolicy(
  original: Hexagram,
  changed: Hexagram | null,
  changingLines: LinePosition[]
): PolicyResult {
  const count = changingLines.length;
  const traces: RuleTrace[] = [];

  let primaryTexts: TextRef[] = [];
  let secondaryTexts: TextRef[] = [];
  let rationale = "";

  if (count === 0) {
    primaryTexts = [makeGuaCiRef(original)];
    secondaryTexts = [makeTuanRef(original), makeXiangOverallRef(original)];
    rationale = "无动爻，以本卦卦辞为主。（兼容策略同经典策略）";
  } else if (count === 1) {
    const pos = changingLines[0];
    primaryTexts = [makeYaoCiRef(original, pos)];
    secondaryTexts = [makeGuaCiRef(original), makeXiangLineRef(original, pos)];
    rationale = `一爻动（第${pos}爻），以该爻爻辞为主。（兼容策略同经典策略）`;
  } else if (count === 2) {
    // 兼容：两爻等权并看
    primaryTexts = changingLines.map((pos) => makeYaoCiRef(original, pos));
    secondaryTexts = [makeGuaCiRef(original)];
    if (changed) secondaryTexts.push(makeGuaCiRef(changed));
    rationale = `两爻动（第${changingLines.join("、")}爻），两爻等权并看，兼参变卦卦辞。`;
  } else if (count === 3) {
    // 兼容：本卦+变卦+动爻全部并参
    primaryTexts = [makeGuaCiRef(original)];
    if (changed) primaryTexts.push(makeGuaCiRef(changed));
    primaryTexts.push(...changingLines.map((pos) => makeYaoCiRef(original, pos)));
    rationale = "三爻动，本卦变卦卦辞与三爻爻辞全部并参。";
  } else if (count === 4 || count === 5) {
    // 兼容：本卦变卦并参
    primaryTexts = [makeGuaCiRef(original)];
    if (changed) primaryTexts.push(makeGuaCiRef(changed));
    secondaryTexts = changingLines.map((pos) => makeYaoCiRef(original, pos));
    rationale = `${count}爻动，本卦与变卦卦辞并参，动爻爻辞为辅。`;
  } else {
    // 六爻全动：一律本卦变卦并参
    primaryTexts = [makeGuaCiRef(original)];
    if (changed) primaryTexts.push(makeGuaCiRef(changed));
    const yongRef = makeYongCiRef(original);
    if (yongRef) secondaryTexts.push(yongRef);
    rationale = "六爻全动，本卦与变卦卦辞并参。";
  }

  traces.push({
    ruleId: "reading_compatible",
    ruleName: "兼容阅读策略",
    category: "reading",
    inputEvidence: {
      changingLineCount: count,
      changingLines,
      originalHexagramId: original.id,
      changedHexagramId: changed?.id ?? null,
    },
    result: {
      primaryCount: primaryTexts.length,
      secondaryCount: secondaryTexts.length,
      rationale,
    },
    confidence: "medium",
    notes: "兼容策略对多动爻情况采取更宽松的并参方式，传统分歧处不强制单一解读路径。",
  });

  return {
    strategy: {
      policyName: "compatible",
      changingLineCount: count,
      primaryTexts,
      secondaryTexts,
      rationale,
    },
    traces,
  };
}
