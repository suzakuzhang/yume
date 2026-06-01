import type { Yao, TrigramKey, Trigram } from "@/types/trigram";

export const TRIGRAMS: Record<TrigramKey, Trigram> = {
  "乾": {
    key: "乾", name: "乾", lines: [1, 1, 1],
    nature: "天", attribute: "健", familyRole: "父",
    element: "金", direction: "西北",
  },
  "兑": {
    key: "兑", name: "兑", lines: [1, 1, 0],
    nature: "泽", attribute: "说", familyRole: "少女",
    element: "金", direction: "西",
  },
  "离": {
    key: "离", name: "离", lines: [1, 0, 1],
    nature: "火", attribute: "丽", familyRole: "中女",
    element: "火", direction: "南",
  },
  "震": {
    key: "震", name: "震", lines: [1, 0, 0],
    nature: "雷", attribute: "动", familyRole: "长男",
    element: "木", direction: "东",
  },
  "巽": {
    key: "巽", name: "巽", lines: [0, 1, 1],
    nature: "风", attribute: "入", familyRole: "长女",
    element: "木", direction: "东南",
  },
  "坎": {
    key: "坎", name: "坎", lines: [0, 1, 0],
    nature: "水", attribute: "陷", familyRole: "中男",
    element: "水", direction: "北",
  },
  "艮": {
    key: "艮", name: "艮", lines: [0, 0, 1],
    nature: "山", attribute: "止", familyRole: "少男",
    element: "土", direction: "东北",
  },
  "坤": {
    key: "坤", name: "坤", lines: [0, 0, 0],
    nature: "地", attribute: "顺", familyRole: "母",
    element: "土", direction: "西南",
  },
};

// 3-bit binary string → TrigramKey lookup
const TRIGRAM_BY_BINARY: Record<string, TrigramKey> = {};
for (const [key, trigram] of Object.entries(TRIGRAMS)) {
  const binary = trigram.lines.join("");
  TRIGRAM_BY_BINARY[binary] = key as TrigramKey;
}

export function trigramFromBinary(bits: string): TrigramKey | null {
  return TRIGRAM_BY_BINARY[bits] ?? null;
}

export function trigramFromLines(lines: [Yao, Yao, Yao]): TrigramKey | null {
  return trigramFromBinary(lines.join(""));
}
