import { NextResponse } from "next/server";
import { addUsageLog, getDream, updateDream } from "@/lib/store";
import { userFromRequest } from "@/lib/access/auth";
import { buildImagePrompt, generateImage, imageryToPainterly } from "@/lib/painterly/painterly";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ctx = userFromRequest(req);
  if (!ctx) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const dream = getDream(params.id);
  if (!dream || dream.userId !== ctx.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "zh";
  const modelOverride = url.searchParams.get("model") ?? undefined;
  const eb = dream.elementBaseline;
  const element = (locale === "zh" ? eb?.wuxing?.imagery : eb?.western?.imagery) ?? "";

  const painterly = await imageryToPainterly({
    imagery: dream.imageryElements,
    dreamText: dream.dreamText,
    element,
    locale,
    lens: dream.leadGaze,
    meta: { traceId: dream.id, feature: "painterly", phase: "凝象", role: dream.leadGaze || null },
  });
  const imageUrl = await generateImage(buildImagePrompt(dream.imageryElements, element), modelOverride);

  const updated = updateDream(dream.id, {
    painterlyProse: painterly.prose,
    ...(imageUrl ? { imageUrl } : {}),
  });
  addUsageLog({ action: "image", role: ctx.user.role, userId: ctx.user.id, detail: `${painterly.source}${imageUrl ? "+img" : ""}` });

  return NextResponse.json({ painterlyProse: painterly.prose, imageUrl: updated?.imageUrl ?? "", source: painterly.source });
}
