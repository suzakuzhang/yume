import type { Hexagram, LinePosition } from "@/types/hexagram";
import type { TextRef } from "@/types/reading";

function yaoLabel(hex: Hexagram, pos: LinePosition): string {
  const posNames = ["初", "二", "三", "四", "五", "上"];
  const yinYang = hex.lines[pos - 1] === 1 ? "九" : "六";
  const prefix = pos === 1 ? "初" : pos === 6 ? "上" : posNames[pos - 1];
  return pos === 1 || pos === 6 ? `${prefix}${yinYang}` : `${yinYang}${prefix}`;
}

export function makeGuaCiRef(hex: Hexagram): TextRef {
  return {
    ref: `hexagram:${hex.id}:guaCi`,
    label: `${hex.fullName} 卦辞`,
    layer: "经文",
    content: hex.guaCi,
  };
}

export function makeYaoCiRef(hex: Hexagram, pos: LinePosition): TextRef {
  const key = String(pos);
  return {
    ref: `hexagram:${hex.id}:line:${pos}`,
    label: `${hex.fullName} ${yaoLabel(hex, pos)} 爻辞`,
    layer: "经文",
    content: hex.yaoCi[key] ?? "",
  };
}

export function makeYongCiRef(hex: Hexagram): TextRef | null {
  if (!hex.yongCi) return null;
  return {
    ref: `hexagram:${hex.id}:yongCi`,
    label: `${hex.fullName} ${hex.id === 1 ? "用九" : "用六"}`,
    layer: "经文",
    content: hex.yongCi,
  };
}

export function makeTuanRef(hex: Hexagram): TextRef {
  return {
    ref: `hexagram:${hex.id}:tuan`,
    label: `${hex.fullName} 彖传`,
    layer: "传文",
    content: hex.tuan,
  };
}

export function makeXiangOverallRef(hex: Hexagram): TextRef {
  return {
    ref: `hexagram:${hex.id}:xiang:overall`,
    label: `${hex.fullName} 大象传`,
    layer: "传文",
    content: hex.xiang.overall,
  };
}

export function makeXiangLineRef(hex: Hexagram, pos: LinePosition): TextRef {
  const key = String(pos);
  return {
    ref: `hexagram:${hex.id}:xiang:line:${pos}`,
    label: `${hex.fullName} ${yaoLabel(hex, pos)} 小象`,
    layer: "传文",
    content: hex.xiang.lines[key] ?? "",
  };
}
