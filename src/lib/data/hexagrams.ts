import type { Hexagram, HexagramIndex } from "@/types/hexagram";
import type { Yao, TrigramKey } from "@/types/trigram";
import { trigramFromLines } from "./trigrams";
import rawData from "@/data/hexagrams_data.json";

const hexagramsData: Hexagram[] = rawData as unknown as Hexagram[];

function buildIndex(data: Hexagram[]): HexagramIndex {
  const byId = new Map<number, Hexagram>();
  const byName = new Map<string, Hexagram>();
  const byLines = new Map<string, Hexagram>();
  const byTrigrams = new Map<string, Hexagram>();

  for (const hex of data) {
    byId.set(hex.id, hex);
    byName.set(hex.name, hex);
    byLines.set(hex.lines.join(""), hex);
    byTrigrams.set(`${hex.lowerTrigram}_${hex.upperTrigram}`, hex);
  }

  return { byId, byName, byLines, byTrigrams };
}

const INDEX = buildIndex(hexagramsData);

export function getAllHexagrams(): Hexagram[] {
  return hexagramsData;
}

export function getHexagramById(id: number): Hexagram | null {
  return INDEX.byId.get(id) ?? null;
}

export function getHexagramByName(name: string): Hexagram | null {
  return INDEX.byName.get(name) ?? null;
}

export function getHexagramByLines(lines: [Yao, Yao, Yao, Yao, Yao, Yao]): Hexagram | null {
  return INDEX.byLines.get(lines.join("")) ?? null;
}

export function getHexagramByTrigrams(
  lower: TrigramKey,
  upper: TrigramKey
): Hexagram | null {
  return INDEX.byTrigrams.get(`${lower}_${upper}`) ?? null;
}

export function findHexagramFromLines(lines: [Yao, Yao, Yao, Yao, Yao, Yao]): Hexagram | null {
  // Try direct lookup first
  const direct = getHexagramByLines(lines);
  if (direct) return direct;

  // Fallback: resolve via trigrams
  const lowerTrigram = trigramFromLines([lines[0], lines[1], lines[2]]);
  const upperTrigram = trigramFromLines([lines[3], lines[4], lines[5]]);
  if (!lowerTrigram || !upperTrigram) return null;

  return getHexagramByTrigrams(lowerTrigram, upperTrigram);
}
