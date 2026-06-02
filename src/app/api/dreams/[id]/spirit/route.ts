import { NextResponse } from "next/server";
import { addUsageLog, getDream, getReadingByDream } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { callLLM } from "@/lib/llm/callLLM";
import { SPIRITS } from "@/lib/debate/personas";

export const dynamic = "force-dynamic";

type Locale = "zh" | "en";
interface ChatMsg {
  role: "user" | "spirit";
  content: string;
  spirit?: string;
}

/** POST — talk with 1–3 summoned spirits about this dream. One = 独对; two-three
 *  = 群聊 (each spirit also answers the others' replies this turn). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dream = getDream(params.id);
  if (!dream || dream.userId !== ctx.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const locale: Locale = new URL(req.url).searchParams.get("locale") === "en" ? "en" : "zh";
  const body = (await req.json().catch(() => ({}))) as { roles?: string[]; messages?: ChatMsg[]; roundKind?: string };
  const roundKind = body.roundKind === "discuss" ? "discuss" : body.roundKind === "final" ? "final" : "open";
  const roleKeys = Array.isArray(body.roles) ? body.roles.slice(0, 3) : [];
  const history = Array.isArray(body.messages) ? body.messages : [];
  const selected = SPIRITS.filter((s) => roleKeys.includes(s.key));
  if (!selected.length) return NextResponse.json({ error: "至少选择一位灵" }, { status: 400 });

  const reading = getReadingByDream(dream.id) as any;
  const group = selected.length > 1;
  const nameOf = (key?: string) => {
    const sp = SPIRITS.find((s) => s.key === key);
    return sp ? (locale === "zh" ? sp.nameZh : sp.nameEn) : "";
  };

  // ── shared dream context every spirit sees ──
  const eb = dream.elementBaseline as any;
  const cast = reading?.cast;
  const tarot = reading?.tarot;
  const syn = reading?.debate?.synthesis;
  const lines = [
    `意象：${dream.imageryElements.join("、")}`,
    dream.question ? `所问：${dream.question}` : "",
    dream.dreamText ? `梦境：${dream.dreamText}` : "",
    dream.mood ? `心绪：${dream.mood}` : "",
    eb?.ganzhiDay ? `今日基音：${eb.ganzhiDay} · ${eb.wuxing?.cn ?? ""}` : "",
    cast?.original?.fullName ? `所起之卦：本卦${cast.original.fullName}「${cast.original.guaCi ?? ""}」${cast.changed?.fullName ? ` 变${cast.changed.fullName}` : ""}` : "",
    tarot?.name_zh ? `所抽之牌：${tarot.name_zh}（${tarot.orientation === "reversed" ? "逆位" : "正位"}）${tarot.reading?.core ?? ""}` : "",
    syn?.guidance ? `四目光的拂晓之语：${syn.guidance}` : "",
  ].filter(Boolean).join("\n");
  const langNote = locale === "zh" ? "用中文。" : "Respond in English.";
  const hasKey = !!process.env.AIHUBMIX_API_KEY?.trim();

  const histText = history
    .map((m) => (m.role === "user" ? `做梦者：${m.content}` : `【${nameOf(m.spirit)}】${m.content}`))
    .join("\n");

  // ── final round: one shared 结论 that lands the discussion ──
  if (roundKind === "final") {
    const fallback = locale === "zh" ? "众灵各执一见，且把这些话带回你自己。" : "The spirits each saw it differently — carry their words back to yourself.";
    if (!hasKey) return NextResponse.json({ replies: [{ spirit: "_conclusion", name: locale === "zh" ? "结论" : "Conclusion", colorVar: "--gold", content: fallback }] });
    const concSys = `你是这场对话的收束之声。${langNote} 像人说话，3-5句，不啰嗦：点出众灵的共识，或并存的分歧，最后给做梦者一句可带走的话。不替人决定命运。`;
    const concUsr = `这个梦：\n${lines}\n\n对话：\n${histText}`;
    let content = fallback;
    try {
      content = await callLLM(concSys, concUsr, { temperature: 0.7, maxTokens: 400 });
    } catch {
      /* keep fallback */
    }
    addUsageLog({ action: "spirit", role: ctx.user.role, userId: ctx.user.id, detail: "final" });
    return NextResponse.json({ replies: [{ spirit: "_conclusion", name: locale === "zh" ? "结论" : "Conclusion", colorVar: "--gold", content }] });
  }

  // ── static (no key) — opening lines only; nothing new to add when discussing ──
  if (!hasKey) {
    if (roundKind === "discuss") return NextResponse.json({ replies: [] });
    const replies = selected.map((s) => ({ spirit: s.key, name: nameOf(s.key), colorVar: s.colorVar, content: s.staticLine[locale] }));
    return NextResponse.json({ replies });
  }

  // ── open / discuss: each spirit speaks once, seeing the others this round ──
  const brev = group
    ? "像真人聊天那样说话——口语、简短，1-3句就好，别长篇大论，别像写论文。"
    : "像真人那样，亲切、简短，2-4句。";
  const task =
    roundKind === "discuss"
      ? "继续这场讨论：回应或反驳其他灵刚才所说，往前推一步，别重复已说过的话。"
      : "请回应做梦者。";

  const replies: { spirit: string; name: string; colorVar: string; content: string }[] = [];
  for (const s of selected) {
    const others = replies.map((r) => `【${r.name}】${r.content}`).join("\n");
    const sys = `${s.voice}\n\n这个梦的全部线索：\n${lines}\n\n${langNote} ${brev} 不复述线索，不报死吉凶，把人引回他自己。`;
    const usr = `${histText ? `对话至今：\n${histText}\n\n` : ""}${others ? `本轮其他灵已开口：\n${others}\n\n` : ""}${task} 请以「${nameOf(s.key)}」的身份开口。`;
    let content: string;
    try {
      content = await callLLM(sys, usr, { temperature: 0.85, maxTokens: 400 });
    } catch {
      content = s.staticLine[locale];
    }
    replies.push({ spirit: s.key, name: nameOf(s.key), colorVar: s.colorVar, content });
  }

  addUsageLog({ action: "spirit", role: ctx.user.role, userId: ctx.user.id, detail: `${group ? "group" : "single"} · ${roundKind} · ${selected.map((s) => s.key).join(",")}` });
  return NextResponse.json({ replies });
}
