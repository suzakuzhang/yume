/**
 * Legge's (public-domain) English name + judgment (卦辞) per hexagram id, for the
 * EN-locale 问卜 card. Source: ctext.org, verbatim Legge with modern pinyin.
 * Missing ids simply return null → the card falls back to the Chinese 卦辞.
 */
import data from "@/data/hexagrams_en.json";

export interface LeggeEntry {
  name_en: string;
  judgment_en: string;
}

const TABLE = data as Record<string, LeggeEntry | string>;

export function leggeFor(id: number | undefined): LeggeEntry | null {
  if (!id) return null;
  const e = TABLE[String(id)];
  return e && typeof e === "object" ? e : null;
}
