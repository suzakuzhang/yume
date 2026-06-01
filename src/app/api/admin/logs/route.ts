import { NextResponse } from "next/server";
import { getUsageLogs } from "@/lib/store";
import { isAdminRequest } from "@/lib/access/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const url = new URL(req.url);
  const limit = Math.min(200, Number(url.searchParams.get("limit") ?? 50));
  const offset = Number(url.searchParams.get("offset") ?? 0);
  return NextResponse.json(getUsageLogs(limit, offset));
}
