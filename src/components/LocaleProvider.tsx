"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { messages, type Locale, type Messages } from "@/lib/i18n/messages";

const KEY = "yume_locale";

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Messages;
  /** has a locale been explicitly chosen (gate passed)? */
  chosen: boolean;
  /** client mounted (localStorage read) */
  ready: boolean;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLoc] = useState<Locale>("zh");
  const [chosen, setChosen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === "zh" || saved === "en") {
      setLoc(saved);
      setChosen(true);
    } else if (typeof navigator !== "undefined" && !navigator.language.toLowerCase().startsWith("zh")) {
      setLoc("en"); // bias the gate's default, but still ask
    }
    setReady(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLoc(l);
    setChosen(true);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  }, []);

  return (
    <Ctx.Provider value={{ locale, setLocale, t: messages[locale], chosen, ready }}>{children}</Ctx.Provider>
  );
}

export function useLocale(): LocaleCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLocale 必须在 <LocaleProvider> 内使用");
  return c;
}
