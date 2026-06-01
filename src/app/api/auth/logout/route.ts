import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/store";
import { tokenFromRequest } from "@/lib/access/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  deleteSession(tokenFromRequest(req));
  return NextResponse.json({ ok: true });
}
