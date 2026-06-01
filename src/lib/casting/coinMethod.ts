import type { Yao } from "@/types/trigram";
import type { HexagramLine } from "@/types/casting";
import type { LinePosition } from "@/types/hexagram";

/**
 * 铜钱法：三枚铜钱一掷得一爻，共六次得一卦。
 *
 * 每枚铜钱：正面（字）= 3，反面（花）= 2
 * 三枚合计：
 *   6 = 老阴（阴动，changing）
 *   7 = 少阳（阳静）
 *   8 = 少阴（阴静）
 *   9 = 老阳（阳动，changing）
 */

export interface CoinThrow {
  coins: [number, number, number]; // each 2 or 3
  total: number;                    // 6, 7, 8, or 9
  yao: Yao;
  changing: boolean;
}

function throwCoins(): CoinThrow {
  const coins: [number, number, number] = [
    Math.random() < 0.5 ? 2 : 3,
    Math.random() < 0.5 ? 2 : 3,
    Math.random() < 0.5 ? 2 : 3,
  ];
  const total = coins[0] + coins[1] + coins[2];

  let yao: Yao;
  let changing: boolean;

  switch (total) {
    case 6: // 老阴：阴爻，动
      yao = 0;
      changing = true;
      break;
    case 7: // 少阳：阳爻，静
      yao = 1;
      changing = false;
      break;
    case 8: // 少阴：阴爻，静
      yao = 0;
      changing = false;
      break;
    case 9: // 老阳：阳爻，动
      yao = 1;
      changing = true;
      break;
    default:
      yao = 1;
      changing = false;
  }

  return { coins, total, yao, changing };
}

export interface CoinCastResult {
  throws: CoinThrow[];
  lines: HexagramLine[];
}

/**
 * 执行铜钱法起卦，从初爻到上爻掷六次。
 */
export function castByCoin(): CoinCastResult {
  const throws: CoinThrow[] = [];
  const lines: HexagramLine[] = [];

  for (let i = 0; i < 6; i++) {
    const t = throwCoins();
    throws.push(t);
    lines.push({
      position: (i + 1) as LinePosition,
      value: t.yao,
      changing: t.changing,
    });
  }

  return { throws, lines };
}

/**
 * 铜钱符号说明
 */
export function coinLabel(total: number): string {
  switch (total) {
    case 6: return "老阴 ╍○ (动)";
    case 7: return "少阳 ━";
    case 8: return "少阴 ╍";
    case 9: return "老阳 ━○ (动)";
    default: return "?";
  }
}
