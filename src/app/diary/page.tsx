"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "@/components/LocaleProvider";
import { IdEntry } from "@/components/IdEntry";

/**
 * 溯梦 / Retrace — the way back in. Type the id you left at 拂晓 to return to your
 * kept dreams. A already-named session skips straight to the journal.
 */
export default function DiaryPage() {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.anon) router.replace("/journal");
  }, [user, loading, router]);

  if (loading) return <p className="veil phase-label text-center py-16">…</p>;

  return (
    <div className="veil max-w-sm mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <p className="phase-label">{t.diary.title}</p>
        <p className="text-sm text-[var(--muted)] leading-loose">{t.diary.intro}</p>
      </div>
      <IdEntry onDone={() => router.push("/journal")} />
    </div>
  );
}
