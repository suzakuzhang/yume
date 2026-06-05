import { NextResponse } from "next/server";
import { addUsageLog, createDream, getReadingByDream, listDreamsByUser, countDreamsByUser, DEFAULT_QUOTA } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { elementBaselineFor } from "@/lib/almanac";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dreams = listDreamsByUser(ctx.user.id);
  // annotate each with whether a reading exists (for timeline badges)
  const items = dreams.map((d) => ({ ...d, hasReading: !!getReadingByDream(d.id) }));
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  let body: {
    imageryElements?: string[];
    question?: string;
    dreamText?: string;
    mood?: string;
    date?: string;
    leadGaze?: string;
    elementBaseline?: import("@/lib/store/types").ElementBaseline | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const imageryElements = (body.imageryElements ?? [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 12);
  if (imageryElements.length === 0) {
    return NextResponse.json({ error: "至少给出一个梦境意象" }, { status: 400 });
  }

  // per-user dream capacity
  const quota = ctx.user.dreamQuota ?? DEFAULT_QUOTA;
  if (countDreamsByUser(ctx.user.id) >= quota) {
    return NextResponse.json({ error: `梦记容量已满（上限 ${quota}）。请联系管理员调整。` }, { status: 403 });
  }

  const GAZES = ["freud", "jung", "shuxu", "daoism"];
  const leadGaze = GAZES.includes(String(body.leadGaze)) ? String(body.leadGaze) : "";

  // the dreamer's natal chart (命), from their birth date — beside the day's ground note (运)
  let natalBaseline = null;
  if (ctx.user.birth && /^\d{4}-\d{2}-\d{2}$/.test(ctx.user.birth)) {
    natalBaseline = elementBaselineFor(new Date(`${ctx.user.birth}T12:00:00`));
  }

  const dream = createDream({
    userId: ctx.user.id,
    imageryElements,
    question: body.question,
    dreamText: body.dreamText,
    mood: body.mood,
    date: body.date,
    leadGaze,
    elementBaseline: body.elementBaseline ?? null,
    natalBaseline,
  });
  addUsageLog({
    action: "dream_create",
    role: ctx.user.role,
    userId: ctx.user.id,
    detail: imageryElements.join("、"),
  });
  return NextResponse.json({ dream });
}
