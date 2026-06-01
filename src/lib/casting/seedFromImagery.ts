/**
 * 梦象起卦 — seed a hexagram from dream imagery via 八卦类象 (per knowledge_base
 * 04_chinese 梦象起卦). Maps each imagery word to a trigram by a bilingual lexicon,
 * picks the two strongest trigrams as lower/upper, then derives changing lines
 * deterministically from the imagery (same dream → same cast).
 */
import type { HexagramLine } from "@/types/casting";
import type { TrigramKey, Yao } from "@/types/trigram";
import { TRIGRAMS } from "@/lib/data/trigrams";

interface LexEntry {
  key: TrigramKey;
  words: string[];
}
// 八卦类象 lexicon (zh + en). Covers the KB symbol dictionary's stock images.
const LEXICON: LexEntry[] = [
  { key: "离", words: ["火", "焰", "光", "日", "太阳", "灯", "明", "红", "热", "烈", "fire", "flame", "light", "sun", "lamp", "bright", "red", "heat", "burn"] },
  { key: "坎", words: ["水", "海", "河", "雨", "泪", "流", "深", "渊", "寒", "冰", "血", "坠", "落", "water", "sea", "river", "rain", "tear", "flood", "deep", "cold", "ice", "blood", "fall", "sink", "drown"] },
  { key: "震", words: ["雷", "动", "震", "跑", "惊", "车", "马", "龙", "响", "thunder", "move", "run", "shock", "car", "horse", "dragon", "quake", "noise"] },
  { key: "巽", words: ["风", "木", "树", "飘", "鸟", "翅", "飞", "气", "蛇", "wind", "wood", "tree", "bird", "wing", "fly", "flight", "air", "snake", "breath"] },
  { key: "艮", words: ["山", "石", "墙", "门", "止", "静", "坟", "塔", "桥", "mountain", "stone", "rock", "wall", "door", "gate", "still", "tomb", "tower", "bridge", "stop"] },
  { key: "兑", words: ["泽", "湖", "口", "笑", "喜", "说", "镜", "牙", "齿", "lake", "marsh", "mouth", "smile", "joy", "speak", "mirror", "teeth", "tooth"] },
  { key: "乾", words: ["天", "空", "父", "王", "金", "首", "头", "盔", "甲", "神", "圆", "heaven", "sky", "father", "king", "gold", "metal", "head", "helmet", "armor", "armour", "crown", "god"] },
  { key: "坤", words: ["地", "土", "田", "母", "众", "腹", "平", "布", "earth", "ground", "field", "mother", "belly", "crowd", "cloth", "flat", "soil"] },
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function matchTrigram(term: string): TrigramKey | null {
  const t = term.trim().toLowerCase();
  if (!t) return null;
  for (const e of LEXICON) {
    for (const w of e.words) {
      const lw = w.toLowerCase();
      if (t.includes(lw) || lw.includes(t)) return e.key;
    }
  }
  return null;
}

export interface SeedResult {
  lines: HexagramLine[];
  lower: TrigramKey;
  upper: TrigramKey;
  rationale: { term: string; trigram: TrigramKey | null }[];
  matchedCount: number;
}

const ALL_TRIGRAMS: TrigramKey[] = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];

export function seedFromImagery(imagery: string[]): SeedResult {
  const rationale = imagery.map((term) => ({ term, trigram: matchTrigram(term) }));
  const votes = new Map<TrigramKey, number>();
  for (const r of rationale) if (r.trigram) votes.set(r.trigram, (votes.get(r.trigram) ?? 0) + 1);

  const h = hashStr(imagery.join("|") || "夢");
  const ranked = Array.from(votes.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  // choose lower (inner / 体) and upper (outer / 用)
  let lower: TrigramKey;
  let upper: TrigramKey;
  if (ranked.length >= 2) {
    lower = ranked[0];
    upper = ranked[1];
  } else if (ranked.length === 1) {
    lower = ranked[0];
    upper = ALL_TRIGRAMS[h % 8];
    if (upper === lower) upper = ALL_TRIGRAMS[(h + 3) % 8];
  } else {
    lower = ALL_TRIGRAMS[h % 8];
    upper = ALL_TRIGRAMS[(h >> 8) % 8];
  }

  const lo = TRIGRAMS[lower].lines; // [Yao,Yao,Yao] bottom→top
  const up = TRIGRAMS[upper].lines;
  const values: Yao[] = [lo[0], lo[1], lo[2], up[0], up[1], up[2]];

  // 1–2 changing lines, deterministic from the imagery hash
  const c1 = h % 6;
  let c2 = (h >> 12) % 6;
  const twoChanging = ((h >> 20) & 1) === 1 && c2 !== c1;
  const lines: HexagramLine[] = values.map((v, i) => ({
    position: (i + 1) as HexagramLine["position"],
    value: v,
    changing: i === c1 || (twoChanging && i === c2),
  }));

  return { lines, lower, upper, rationale, matchedCount: votes.size };
}
