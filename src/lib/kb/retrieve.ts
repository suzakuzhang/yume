/** Symbol-dictionary retrieval: match a dream's imagery to cross-tradition readings. */
import dict from "@/data/symbol_dictionary.json";

export interface SymbolReading {
  tradition: string;
  meaning: string;
}
export interface SymbolEntry {
  symbol: string;
  readings: SymbolReading[];
}

const DICT = dict as SymbolEntry[];

function tokensOf(symbol: string): string[] {
  return symbol
    .split(/[/、,，·／|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Entries whose symbol overlaps any imagery word or dream-text token. */
export function matchSymbols(imagery: string[], dreamText = ""): SymbolEntry[] {
  const hay = [...imagery, ...dreamText.split(/[\s，。、,.!?；;]+/)]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  if (hay.length === 0) return [];
  const out: SymbolEntry[] = [];
  for (const e of DICT) {
    const toks = tokensOf(e.symbol);
    const hit = toks.some((tok) =>
      hay.some((h) => h === tok || (h.length >= 2 && tok.includes(h)) || (tok.length >= 2 && h.includes(tok)))
    );
    if (hit) out.push(e);
  }
  return out;
}

/** For a tradition, the matched symbols' readings: [{symbol, meaning}]. */
export function readingsFor(entries: SymbolEntry[], tradition: string): { symbol: string; meaning: string }[] {
  return entries
    .map((e) => ({ symbol: shortSymbol(e.symbol), meaning: e.readings.find((r) => r.tradition === tradition)?.meaning ?? "" }))
    .filter((x) => x.meaning);
}

/** A compact label for a symbol — prefer the CJK part if present. */
export function shortSymbol(symbol: string): string {
  const toks = symbol.split("/").map((s) => s.trim());
  const cjk = toks.find((t) => /[一-鿿]/.test(t));
  return cjk ?? toks[0] ?? symbol;
}
