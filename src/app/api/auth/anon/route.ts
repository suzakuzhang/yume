import { NextResponse } from "next/server";
import { addUsageLog, createAnonUser, createSession } from "@/lib/store";
import { getCapabilities } from "@/lib/access/roles";

export const dynamic = "force-dynamic";

/**
 * Silent anonymous entry. Called on first dream so the reading pipeline (which
 * needs an authenticated, owning user) works with no visible login. The dreamer
 * stays anonymous until they choose to keep the dream + claim an id at 拂晓.
 */
export async function POST() {
  const user = createAnonUser();
  const session = createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
    accessType: "anon",
  });
  addUsageLog({ action: "anon", role: user.role, userId: user.id, detail: "silent" });

  return NextResponse.json({
    accessToken: session.token,
    user: { id: user.id, username: user.username, role: user.role, anon: true },
    capabilities: getCapabilities(user.role),
    expiresAt: session.expiresAt,
  });
}
