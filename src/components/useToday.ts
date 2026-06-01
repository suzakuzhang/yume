"use client";

import { useEffect, useState } from "react";
import { almanac, type Almanac } from "@/lib/almanac";

/** Today's almanac, computed from the visitor's local clock after mount. */
export function useToday(): Almanac | null {
  const [a, setA] = useState<Almanac | null>(null);
  useEffect(() => {
    setA(almanac(new Date()));
  }, []);
  return a;
}
