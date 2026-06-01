"use client";

import { useEffect, useState } from "react";
import { wallDate } from "@/lib/almanac/time";

/** Live "now" in the given timezone, refreshed every `intervalMs`. Null until mounted. */
export function useNow(tz: string, intervalMs = 30000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!tz) return;
    const tick = () => setNow(wallDate(tz));
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tz, intervalMs]);
  return now;
}
