import cards from "@/data/tarot_cards.json";

export interface TarotCard {
  id: number;
  name_zh: string;
  name_en: string;
  image: string;
  visual_description: string;
  summary_meaning: string;
  upright_meaning: string;
  reversed_meaning: string;
}

export type Orientation = "upright" | "reversed";

export const DECK = cards as TarotCard[];

/** Draw one card with a random orientation (Major Arcana, 22 cards). */
export function drawCard(): { card: TarotCard; orientation: Orientation } {
  const card = DECK[Math.floor(Math.random() * DECK.length)];
  const orientation: Orientation = Math.random() < 0.5 ? "upright" : "reversed";
  return { card, orientation };
}
