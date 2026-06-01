/**
 * Runtime access policy, driven by env so it flips without code changes.
 *
 * Open beta (default): registration needs NO invite code — anyone can try yume.
 * To lock down later, set YUME_REQUIRE_INVITE=1 in the Render env; the invite
 * code becomes mandatory again (existing invite-code machinery is untouched).
 */
export function requireInvite(): boolean {
  const v = process.env.YUME_REQUIRE_INVITE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isOpenBeta(): boolean {
  return !requireInvite();
}
