import { NextResponse } from "next/server";
import { getConfig, setConfig } from "@/lib/store";
import { isAdminRequest } from "@/lib/access/auth";
import { requireInvite } from "@/lib/access/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "无权限" }, { status: 403 });
  // `effective` is what the entry flow actually uses (override ?? env default)
  return NextResponse.json({ config: getConfig(), effective: { requireInvite: requireInvite() } });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { requireInvite?: boolean };
  if (typeof body.requireInvite === "boolean") setConfig({ requireInvite: body.requireInvite });
  return NextResponse.json({ config: getConfig(), effective: { requireInvite: requireInvite() } });
}
