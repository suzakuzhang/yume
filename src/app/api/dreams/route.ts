import { NextResponse } from "next/server";
import { addUsageLog, createDream, getReadingByDream, listDreamsByUser } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";

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

  const dream = createDream({
    userId: ctx.user.id,
    imageryElements,
    question: body.question,
    dreamText: body.dreamText,
    mood: body.mood,
    date: body.date,
    elementBaseline: body.elementBaseline ?? null,
  });
  addUsageLog({
    action: "dream_create",
    role: ctx.user.role,
    userId: ctx.user.id,
    detail: imageryElements.join("、"),
  });
  return NextResponse.json({ dream });
}
