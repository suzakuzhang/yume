import { NextResponse } from "next/server";
import { countDreamsByUser, deleteUser, listUsers, updateUser, DEFAULT_QUOTA } from "@/lib/store";
import { isAdminRequest } from "@/lib/access/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const items = listUsers().map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    inviteCodeUsed: u.inviteCodeUsed,
    createdAt: u.createdAt,
    birth: u.birth ?? "",
    dreamQuota: u.dreamQuota ?? DEFAULT_QUOTA,
    dreamCount: countDreamsByUser(u.id),
  }));
  return NextResponse.json({ items, defaultQuota: DEFAULT_QUOTA });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    id?: string;
    dreamQuota?: number;
    birth?: string;
  };
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "缺少用户 id" }, { status: 400 });

  if (body.action === "delete") {
    const ok = deleteUser(id);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "未找到用户" }, { status: 404 });
  }
  if (body.action === "update") {
    const patch: { dreamQuota?: number; birth?: string } = {};
    if (body.dreamQuota !== undefined) patch.dreamQuota = Math.max(0, Math.floor(Number(body.dreamQuota) || 0));
    if (body.birth !== undefined) patch.birth = String(body.birth);
    const u = updateUser(id, patch);
    return u ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "未找到用户" }, { status: 404 });
  }
  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
