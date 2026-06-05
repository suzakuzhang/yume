/**
 * Offline almanac — deterministic calendar/astronomy for the dream background.
 * No network, no keys. All functions take a JS Date (caller passes the visitor's
 * local time). Day-pillar verified: 2000-01-07 → 甲子.
 */

const mod = (n: number, m: number) => ((n % m) + m) % m;

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** Integer Julian Day Number (at noon) for a civil Gregorian date. */
export function jdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

export interface Ganzhi {
  stem: string;
  branch: string;
  stemIdx: number;
  branchIdx: number;
  text: string;
}
function gz(stemIdx: number, branchIdx: number): Ganzhi {
  const s = mod(stemIdx, 10);
  const b = mod(branchIdx, 12);
  return { stem: STEMS[s], branch: BRANCHES[b], stemIdx: s, branchIdx: b, text: STEMS[s] + BRANCHES[b] };
}

export function dayGanzhi(date: Date): Ganzhi {
  const j = jdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return gz(j + 9, j + 1); // verified anchor: 2000-01-07 → 甲子
}

/** Year pillar, switching at ~立春 (Feb 4). */
export function yearGanzhi(date: Date): Ganzhi {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const adj = m > 2 || (m === 2 && d >= 4) ? date.getFullYear() : date.getFullYear() - 1;
  return gz(adj - 4, adj - 4);
}

/** Hour pillar via 五鼠遁 from the day stem. */
export function hourGanzhi(date: Date, dayStemIdx: number): Ganzhi {
  const h = date.getHours();
  const branchIdx = mod(Math.floor((h + 1) / 2), 12);
  const stemIdx = mod((dayStemIdx % 5) * 2 + branchIdx, 10);
  return gz(stemIdx, branchIdx);
}

export interface FourSymbol {
  key: "azure-dragon" | "vermilion-bird" | "white-tiger" | "black-tortoise";
  cn: string;
  animal: string;
  en: string;
  direction: string;
  element: string;
  color: string;
}
/** Day branch → one of the Four Symbols (canonical 三会方位). */
export function fourSymbol(branchIdx: number): FourSymbol {
  // 寅卯辰=2,3,4 东; 巳午未=5,6,7 南; 申酉戌=8,9,10 西; 亥子丑=11,0,1 北
  if ([2, 3, 4].includes(branchIdx))
    return { key: "azure-dragon", cn: "青龙", animal: "龙", en: "Azure Dragon", direction: "东", element: "木", color: "#5fae8e" };
  if ([5, 6, 7].includes(branchIdx))
    return { key: "vermilion-bird", cn: "朱雀", animal: "雀", en: "Vermilion Bird", direction: "南", element: "火", color: "#c95c63" };
  if ([8, 9, 10].includes(branchIdx))
    return { key: "white-tiger", cn: "白虎", animal: "虎", en: "White Tiger", direction: "西", element: "金", color: "#cfd3e0" };
  return { key: "black-tortoise", cn: "玄武", animal: "龟", en: "Black Tortoise", direction: "北", element: "水", color: "#6f8fd8" };
}

/** The 28 lunar mansions in canonical order (decorative ring). */
export const MANSIONS = [
  "角", "亢", "氐", "房", "心", "尾", "箕", // 东 青龙
  "斗", "牛", "女", "虚", "危", "室", "壁", // 北 玄武
  "奎", "娄", "胃", "昴", "毕", "觜", "参", // 西 白虎
  "井", "鬼", "柳", "星", "张", "翼", "轸", // 南 朱雀
];

export interface ZodiacSign {
  key: string;
  en: string;
  cn: string;
  glyph: string;
}
const SIGNS: { sign: ZodiacSign; until: [number, number] }[] = [
  { sign: { key: "capricorn", en: "Capricorn", cn: "摩羯", glyph: "♑" }, until: [1, 19] },
  { sign: { key: "aquarius", en: "Aquarius", cn: "水瓶", glyph: "♒" }, until: [2, 18] },
  { sign: { key: "pisces", en: "Pisces", cn: "双鱼", glyph: "♓" }, until: [3, 20] },
  { sign: { key: "aries", en: "Aries", cn: "白羊", glyph: "♈" }, until: [4, 19] },
  { sign: { key: "taurus", en: "Taurus", cn: "金牛", glyph: "♉" }, until: [5, 20] },
  { sign: { key: "gemini", en: "Gemini", cn: "双子", glyph: "♊" }, until: [6, 20] },
  { sign: { key: "cancer", en: "Cancer", cn: "巨蟹", glyph: "♋" }, until: [7, 22] },
  { sign: { key: "leo", en: "Leo", cn: "狮子", glyph: "♌" }, until: [8, 22] },
  { sign: { key: "virgo", en: "Virgo", cn: "处女", glyph: "♍" }, until: [9, 22] },
  { sign: { key: "libra", en: "Libra", cn: "天秤", glyph: "♎" }, until: [10, 22] },
  { sign: { key: "scorpio", en: "Scorpio", cn: "天蝎", glyph: "♏" }, until: [11, 21] },
  { sign: { key: "sagittarius", en: "Sagittarius", cn: "射手", glyph: "♐" }, until: [12, 21] },
];
/** The full 12 zodiac glyphs, fixed wheel order (Aries first). */
export const ZODIAC_WHEEL: ZodiacSign[] = [
  { key: "aries", en: "Aries", cn: "白羊", glyph: "♈" },
  { key: "taurus", en: "Taurus", cn: "金牛", glyph: "♉" },
  { key: "gemini", en: "Gemini", cn: "双子", glyph: "♊" },
  { key: "cancer", en: "Cancer", cn: "巨蟹", glyph: "♋" },
  { key: "leo", en: "Leo", cn: "狮子", glyph: "♌" },
  { key: "virgo", en: "Virgo", cn: "处女", glyph: "♍" },
  { key: "libra", en: "Libra", cn: "天秤", glyph: "♎" },
  { key: "scorpio", en: "Scorpio", cn: "天蝎", glyph: "♏" },
  { key: "sagittarius", en: "Sagittarius", cn: "射手", glyph: "♐" },
  { key: "capricorn", en: "Capricorn", cn: "摩羯", glyph: "♑" },
  { key: "aquarius", en: "Aquarius", cn: "水瓶", glyph: "♒" },
  { key: "pisces", en: "Pisces", cn: "双鱼", glyph: "♓" },
];
export function sunSign(date: Date): ZodiacSign {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  for (const { sign, until } of SIGNS) {
    if (m < until[0] || (m === until[0] && d <= until[1])) return sign;
  }
  return SIGNS[0].sign; // late Dec → Capricorn
}

export interface MoonPhase {
  fraction: number; // 0 new → 0.5 full → 1 new
  illum: number; // 0..1 illuminated
  enName: string;
  cnName: string;
}
export function moonPhase(date: Date): MoonPhase {
  const SYNODIC = 29.530588853;
  const j = jdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const frac = mod(j - 2451550 + 0.5, SYNODIC) / SYNODIC; // ref new moon 2000-01-06
  const illum = (1 - Math.cos(2 * Math.PI * frac)) / 2;
  const names: [number, string, string][] = [
    [0.03, "New Moon", "新月"],
    [0.22, "Waxing Crescent", "蛾眉月"],
    [0.28, "First Quarter", "上弦月"],
    [0.47, "Waxing Gibbous", "盈凸月"],
    [0.53, "Full Moon", "满月"],
    [0.72, "Waning Gibbous", "亏凸月"],
    [0.78, "Last Quarter", "下弦月"],
    [0.97, "Waning Crescent", "残月"],
  ];
  let enName = "New Moon";
  let cnName = "新月";
  for (const [t, en, cn] of names) {
    if (frac <= t) {
      enName = en;
      cnName = cn;
      break;
    }
  }
  return { fraction: frac, illum, enName, cnName };
}

/** A unified element descriptor (五行 entry or a Western element). */
export interface ElementInfo {
  key: string;
  cn: string;
  en: string;
  color: string;
  imagery: string; // a short clause used as reading baseline + UI flavor
}

// 天干 → 五行 (by stem index): 甲乙木 丙丁火 戊己土 庚辛金 壬癸水
const STEM_WUXING = ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"];
export const WUXING: Record<string, ElementInfo> = {
  wood: { key: "wood", cn: "木", en: "Wood", color: "#5fae8e", imagery: "生长 · 舒展 · 风木向上" },
  fire: { key: "fire", cn: "火", en: "Fire", color: "#c95c63", imagery: "光热 · 升腾 · 显明炽烈" },
  earth: { key: "earth", cn: "土", en: "Earth", color: "#c9a86a", imagery: "承载 · 厚重 · 居中守常" },
  metal: { key: "metal", cn: "金", en: "Metal", color: "#cfd3e0", imagery: "收敛 · 肃降 · 锋锐决断" },
  water: { key: "water", cn: "水", en: "Water", color: "#6f8fd8", imagery: "流动 · 向下 · 潜藏润下" },
};
/** Day-master element = 五行 of the day stem (日主). */
export function dayMasterWuxing(dayStemIdx: number): ElementInfo {
  return WUXING[STEM_WUXING[dayStemIdx]];
}

// Western zodiac → classical element
const SIGN_ELEMENT: Record<string, string> = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};
export const WESTERN_ELEMENTS: Record<string, ElementInfo> = {
  fire: { key: "fire", cn: "火", en: "Fire", color: "#c95c63", imagery: "will, passion, spirit" },
  earth: { key: "earth", cn: "土", en: "Earth", color: "#c9a86a", imagery: "body, matter, steadiness" },
  air: { key: "air", cn: "风", en: "Air", color: "#b3a6ef", imagery: "mind, word, breath" },
  water: { key: "water", cn: "水", en: "Water", color: "#6f8fd8", imagery: "feeling, dream, depth" },
};
export function signElement(signKey: string): ElementInfo {
  return WESTERN_ELEMENTS[SIGN_ELEMENT[signKey] ?? "air"];
}

export interface Almanac {
  year: Ganzhi;
  day: Ganzhi;
  hour: Ganzhi;
  four: FourSymbol;
  sun: ZodiacSign;
  moon: MoonPhase;
  wuxing: ElementInfo; // 日主五行 — the day's ground note (eastern)
  western: ElementInfo; // sun-sign classical element (western)
  isoDate: string;
}
export function almanac(date: Date): Almanac {
  const day = dayGanzhi(date);
  return {
    year: yearGanzhi(date),
    day,
    hour: hourGanzhi(date, day.stemIdx),
    four: fourSymbol(day.branchIdx),
    sun: sunSign(date),
    moon: moonPhase(date),
    wuxing: dayMasterWuxing(day.stemIdx),
    western: signElement(sunSign(date).key),
    isoDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
  };
}

/**
 * Flatten an almanac reading into the persisted ElementBaseline shape. Used both
 * for the day's ground note (运) and, from a birth date, the dreamer's natal chart
 * (命). Note: with only a birth date the hour pillar is approximate.
 */
export function elementBaselineFor(date: Date): import("@/lib/store/types").ElementBaseline {
  const a = almanac(date);
  return {
    ganzhiDay: a.day.text,
    ganzhiYear: a.year.text,
    ganzhiHour: a.hour.text,
    wuxing: { key: a.wuxing.key, cn: a.wuxing.cn, imagery: a.wuxing.imagery },
    western: { key: a.western.key, en: a.western.en, imagery: a.western.imagery },
    sun: a.sun.en,
    four: a.four.cn,
    capturedAt: new Date().toISOString(),
  };
}
