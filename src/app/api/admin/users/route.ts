import { NextResponse } from "next/server";
import { listUsers } from "@/lib/store";
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
  }));
  return NextResponse.json({ items });
}
