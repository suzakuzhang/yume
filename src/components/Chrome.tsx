"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

// the immersive full-screen decks render their own `fixed inset-0` overlay, which
// would sit on top of (and swallow clicks to) this header. there is no nav step to
// "return" to inside them, so the header is hidden there entirely.
const IMMERSIVE = (path: string) => path === "/" || path.startsWith("/dream/");

const GLOW = { color: "var(--moon)", textShadow: "0 0 10px var(--moon)" } as const;
const GITHUB_URL = "https://github.com/suzakuzhang";

/** Locale-aware header + footer wrapping page content. */
export function Chrome({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const { user, loading, logout } = useAuth();
  const pathname = usePathname() || "/";

  if (IMMERSIVE(pathname)) return <>{children}</>;

  // a nav item glows when you are on it, dims otherwise; hovering a dim one lights it and it links across.
  const navItem = (href: string, label: string) => {
    const here = pathname === href;
    return (
      <a
        href={href}
        aria-current={here ? "page" : undefined}
        className={`text-xs tracking-[0.25em] transition-colors ${here ? "" : "text-[var(--muted)] hover:text-[var(--moon)]"}`}
        style={here ? GLOW : undefined}
      >
        {label}
      </a>
    );
  };

  // the two tongues — the one you are in glows; the other is dim until you reach for it, then it carries you across.
  const langItem = (l: "zh" | "en", label: string) => {
    const on = locale === l;
    return (
      <button
        onClick={() => !on && setLocale(l)}
        aria-pressed={on}
        aria-label={l === "zh" ? "中文" : "English"}
        className={`tracking-[0.25em] transition-colors ${on ? "cursor-default" : "text-[var(--muted)] hover:text-[var(--moon)]"}`}
        style={on ? GLOW : undefined}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <header className="px-6 py-5">
        <nav className="max-w-3xl mx-auto flex items-center gap-7">
          <a href="/" className="text-base tracking-[0.18em] font-medium">
            yume<span className="text-[var(--accent)] glow ml-1">{t.brand}</span>
          </a>
          {navItem("/today", t.nav.today)}
          {navItem("/journal", t.nav.timeline)}

          <div className="ml-auto flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              {langItem("zh", "中文")}
              <span className="text-[var(--border)]">/</span>
              {langItem("en", "EN")}
            </span>
            {loading ? (
              <span className="text-[var(--muted)]">…</span>
            ) : user ? (
              <span className="flex items-center gap-3">
                <span className="text-[var(--muted)]">{user.username}</span>
                <button onClick={() => logout()} className="text-[var(--muted)] hover:text-[var(--moon)]">
                  {t.nav.signout}
                </button>
              </span>
            ) : (
              <a href="/login" className="text-[var(--muted)] hover:text-[var(--moon)]">
                {t.nav.signin}
              </a>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">{children}</main>

      <footer className="px-6 pb-8 pt-2">
        <div className="max-w-3xl mx-auto text-center text-xs text-[var(--muted)] space-y-1">
          <p>{t.foot}</p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block underline underline-offset-4 hover:text-[var(--moon)]"
          >
            Designed by Shumin Zhang
          </a>
        </div>
      </footer>
    </>
  );
}
