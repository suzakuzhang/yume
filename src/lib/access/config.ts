/**
 * Runtime access policy. An admin toggle (stored in the data store) wins; if it
 * has never been set, we fall back to the env default YUME_REQUIRE_INVITE.
 *
 * Open beta (default): entry needs NO invite code — anyone can try yume. Lock it
 * down from /admin (or set YUME_REQUIRE_INVITE=1) to make the code mandatory.
 */
import { getConfig } from "@/lib/store";

function envRequireInvite(): boolean {
  const v = process.env.YUME_REQUIRE_INVITE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function requireInvite(): boolean {
  const override = getConfig().requireInvite;
  return override === undefined ? envRequireInvite() : override;
}

export function isOpenBeta(): boolean {
  return !requireInvite();
}
