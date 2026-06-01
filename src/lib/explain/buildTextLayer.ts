import type { ReadingStrategy, TextRef } from "@/types/reading";

export function buildTextLayer(strategy: ReadingStrategy): TextRef[] {
  return [...strategy.primaryTexts, ...strategy.secondaryTexts];
}
