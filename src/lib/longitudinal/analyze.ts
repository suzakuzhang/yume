/**
 * Longitudinal (纵向) analysis over a user's dream timeline. Pure & key-free:
 * recurrent imagery, mood distribution, 五行/element distribution, and recurrent
 * symbol-dictionary themes. The LLM "individuation arc" narrative is separate
 * (key-gated, see the route).
 */
import type { Dream } from "@/lib/store/types";
import { matchSymbols, shortSymbol } from "@/lib/kb/retrieve";
import { WUXING, WESTERN_ELEMENTS } from "@/lib/almanac";

export interface Tally {
  label: string;
  count: number;
  color?: string;
}
export interface Timeline {
  count: number;
  from: string;
  to: string;
  recurrentImagery: Tally[];
  moods: Tally[];
  wuxing: Tally[];
  western: Tally[];
  recurrentSymbols: { symbol: string; count: number }[];
}

function tally<T>(items: T[], keyOf: (t: T) => string | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = keyOf(it);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}
function topTallies(m: Map<string, number>, limit: number, colorOf?: (k: string) => string | undefined): Tally[] {
  return Array.from(m.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, color: colorOf?.(label) }));
}

export function analyzeTimeline(dreams: Dream[]): Timeline {
  const sorted = dreams.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // recurrent imagery (exact element strings)
  const imageryAll = sorted.flatMap((d) => d.imageryElements);
  const imageryMap = tally(imageryAll, (s) => s);
  const recurrentImagery = topTallies(imageryMap, 10).filter((t) => t.count >= 1);

  // moods
  const moods = topTallies(tally(sorted, (d) => d.mood || undefined), 8);

  // 五行 (eastern, from day-master baseline)
  const wuxingMap = tally(sorted, (d) => d.elementBaseline?.wuxing?.cn);
  const wuxing = topTallies(wuxingMap, 5, (cn) => {
    const e = Object.values(WUXING).find((w) => w.cn === cn);
    return e?.color;
  });

  // western element (from sun-sign baseline)
  const westernMap = tally(sorted, (d) => d.elementBaseline?.western?.en);
  const western = topTallies(westernMap, 5, (en) => {
    const e = Object.values(WESTERN_ELEMENTS).find((w) => w.en === en);
    return e?.color;
  });

  // recurrent symbol-dictionary themes (which archetypal images recur across nights)
  const symbolMap = new Map<string, number>();
  for (const d of sorted) {
    const matched = matchSymbols(d.imageryElements, d.dreamText).map((e) => shortSymbol(e.symbol));
    for (const s of Array.from(new Set(matched))) symbolMap.set(s, (symbolMap.get(s) ?? 0) + 1);
  }
  const recurrentSymbols = Array.from(symbolMap.entries())
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([symbol, count]) => ({ symbol, count }));

  return {
    count: sorted.length,
    from: sorted[0]?.date ?? "",
    to: sorted[sorted.length - 1]?.date ?? "",
    recurrentImagery,
    moods,
    wuxing,
    western,
    recurrentSymbols,
  };
}
