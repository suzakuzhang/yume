import { NextResponse } from "next/server";
import { requireInvite } from "@/lib/access/config";

export const dynamic = "force-dynamic";

/** Public runtime config the client needs (no secrets). */
export async function GET() {
  return NextResponse.json({ requireInvite: requireInvite(), openBeta: !requireInvite() });
}
