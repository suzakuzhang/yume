import { NextResponse } from "next/server";
import { getCapabilities, ROLE_NORMAL } from "@/lib/access/roles";
import { userFromRequest } from "@/lib/access/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = userFromRequest(req);
  if (!ctx) {
    return NextResponse.json({
      authed: false,
      user: null,
      capabilities: getCapabilities(ROLE_NORMAL),
    });
  }
  return NextResponse.json({
    authed: true,
    user: { id: ctx.user.id, username: ctx.user.username, role: ctx.user.role },
    capabilities: getCapabilities(ctx.user.role),
    expiresAt: ctx.session.expiresAt,
  });
}
