/** Timezone helpers for the live mystic clock. */

export const COMMON_TZ = [
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

/** Browser/OS timezone — the auto-detected zone (more reliable than IP geo). */
export function autoTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** A Date whose *local* getters read the wall-clock values of `tz` right now. */
export function wallDate(tz: string, base: Date = new Date()): Date {
  try {
    const f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const p: Record<string, string> = {};
    for (const part of f.formatToParts(base)) if (part.type !== "literal") p[part.type] = part.value;
    let h = Number(p.hour);
    if (h === 24) h = 0;
    return new Date(Number(p.year), Number(p.month) - 1, Number(p.day), h, Number(p.minute), Number(p.second));
  } catch {
    return base;
  }
}

/** "HH:MM" wall-clock string for the zone. */
export function clockText(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
