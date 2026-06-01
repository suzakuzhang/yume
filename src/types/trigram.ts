export type Yao = 0 | 1; // 0 = 阴 (broken line), 1 = 阳 (solid line)

export type TrigramKey =
  | "乾" | "兑" | "离" | "震"
  | "巽" | "坎" | "艮" | "坤";

export interface Trigram {
  key: TrigramKey;
  name: string;
  lines: [Yao, Yao, Yao]; // bottom to top
  nature: string;          // 天/泽/火/雷/风/水/山/地
  attribute: string;       // 健/说/丽/动/入/陷/止/顺
  familyRole: string;      // 父/少女/中女/长男/长女/中男/少男/母
  element: string;         // 五行
  direction: string;       // 方位
}
