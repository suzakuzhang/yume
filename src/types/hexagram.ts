import type { Yao, TrigramKey } from "./trigram";

export type LinePosition = 1 | 2 | 3 | 4 | 5 | 6;

export interface Hexagram {
  id: number;                // 1-64 (King Wen sequence)
  name: string;              // e.g. "乾"
  fullName: string;          // e.g. "乾为天"
  upperTrigram: TrigramKey;
  lowerTrigram: TrigramKey;
  lines: [Yao, Yao, Yao, Yao, Yao, Yao]; // bottom (pos 1) to top (pos 6)
  section: "上经" | "下经";

  // 经文层
  guaCi: string;
  yaoCi: Record<string, string>; // keys "1"-"6"
  yongCi?: string;               // 用九/用六 (乾/坤 only)

  // 传文层
  tuan: string;                  // 彖传
  xiang: {
    overall: string;             // 大象传
    lines: Record<string, string>; // 小象传
  };
  wenyan?: string;               // 文言 (乾/坤)
  xugua?: string;                // 序卦传
  zagua?: string;                // 杂卦传

  notes?: string[];              // 朱熹注/编者注
}

export interface HexagramIndex {
  byId: Map<number, Hexagram>;
  byName: Map<string, Hexagram>;
  byLines: Map<string, Hexagram>;       // key = "111111"
  byTrigrams: Map<string, Hexagram>;    // key = "乾_乾"
}
