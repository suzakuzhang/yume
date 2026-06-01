"use client";

import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

/** Locale-aware header + footer wrapping page content. */
export function Chrome({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLocale();
  const { user, loading, logout } = useAuth();

  return (
    <>
      <header className="px-6 py-5">
        <nav className="max-w-3xl mx-auto flex items-center gap-7">
          <a href="/" className="text-base tracking-[0.18em] font-medium">
            yume<span className="text-[var(--accent)] glow ml-1">{t.brand}</span>
          </a>
          <a href="/today" className="text-xs tracking-[0.25em] text-[var(--muted)] hover:text-[var(--moon)]">
            {t.nav.today}
          </a>
          <a href="/journal" className="text-xs tracking-[0.25em] text-[var(--muted)] hover:text-[var(--moon)]">
            {t.nav.timeline}
          </a>

          <div className="ml-auto flex items-center gap-4 text-xs">
            <button
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="tracking-[0.25em] text-[var(--muted)] hover:text-[var(--moon)]"
              aria-label="switch language"
            >
              {t.langOther}
            </button>
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
    </>
  );
}
